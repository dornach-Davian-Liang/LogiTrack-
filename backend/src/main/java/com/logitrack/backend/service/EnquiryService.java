package com.logitrack.backend.service;

import com.logitrack.backend.dto.ReferencePreview;
import com.logitrack.backend.entity.*;
import com.logitrack.backend.repository.*;
import com.logitrack.backend.specification.EnquirySpecification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * 询价核心业务服务 v3
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EnquiryService {
    
    private final EnquiryRepository enquiryRepository;
    private final ProductRepository productRepository;
    private final EnquiryPortService enquiryPortService;
    private final EnquiryRouteGroupRepository routeGroupRepository;
    private final EnquiryRouteGroupPolRepository routeGroupPolRepository;
    private final EnquiryRouteGroupPodRepository routeGroupPodRepository;
    
    // ═══════════════════════════════════
    // 查询方法
    // ═══════════════════════════════════
    
    public List<Enquiry> getAllEnquiries() {
        List<Enquiry> enquiries = enquiryRepository.findAll();
        enquiries.forEach(this::loadTransientData);
        return enquiries;
    }
    
    public Page<Enquiry> getEnquiries(Pageable pageable) {
        Page<Enquiry> page = enquiryRepository.findAll(pageable);
        page.getContent().forEach(this::loadTransientData);
        return page;
    }
    
    public Page<Enquiry> searchEnquiries(String keyword, Pageable pageable) {
        Page<Enquiry> page = enquiryRepository.searchEnquiries(keyword, pageable);
        page.getContent().forEach(this::loadTransientData);
        return page;
    }

    /**
     * 带多条件筛选的分页查询
     */
    public Page<Enquiry> getEnquiriesFiltered(
            String keyword, String status, String productCode,
            String cargoTypeCode, String salesCountryCode,
            String assignedCnOffice, String coreNonCore,
            String dateFrom, String dateTo, Pageable pageable) {
        Specification<Enquiry> spec = EnquirySpecification.withFilters(
                keyword, status, productCode, cargoTypeCode,
                salesCountryCode, assignedCnOffice, coreNonCore,
                dateFrom, dateTo);
        Page<Enquiry> page = enquiryRepository.findAll(spec, pageable);
        page.getContent().forEach(this::loadTransientData);
        return page;
    }

    public Optional<Enquiry> getEnquiryById(Long id) {
        Optional<Enquiry> enquiry = enquiryRepository.findById(id);
        enquiry.ifPresent(this::loadTransientData);
        return enquiry;
    }
    
    public Optional<Enquiry> getEnquiryByRefNumber(String refNumber) {
        return enquiryRepository.findByRefNumber(refNumber);
    }
    
    public List<Enquiry> getEnquiriesByStatus(Enquiry.EnquiryStatus status) {
        return enquiryRepository.findByStatus(status);
    }
    
    public long countByStatus(Enquiry.EnquiryStatus status) {
        return enquiryRepository.countByStatus(status);
    }
    
    // ═══════════════════════════════════
    // Reference Number 生成
    // ═══════════════════════════════════
    
    private String resolveProductAbbr(String productCode) {
        if (productCode == null) return "X";
        return productRepository.findById(productCode)
                .map(Product::getAbbr)
                .orElse("X");
    }

    private String buildRefNumber(String refMonth, int seq, String abbr, int serialNumber) {
        return String.format("CN%s%03d-%s%s",
                refMonth, seq, abbr,
                serialNumber > 0 ? String.valueOf(serialNumber) : "");
    }

    public ReferencePreview getNextReference(LocalDate date, String productCode) {
        LocalDate effectiveDate = date != null ? date : LocalDate.now();
        String refMonth = effectiveDate.format(DateTimeFormatter.ofPattern("yyMM"));
        String abbr = resolveProductAbbr(productCode);
        Integer maxSeq = enquiryRepository.findMaxMonthlySequence(refMonth);
        int nextSeq = (maxSeq == null ? 0 : maxSeq) + 1;
        String refNumber = buildRefNumber(refMonth, nextSeq, abbr, 0);
        return new ReferencePreview(refNumber, refMonth, nextSeq, 0, abbr);
    }

    public ReferencePreview getNextIncreaseReference(Long enquiryId) {
        Enquiry source = enquiryRepository.findById(enquiryId)
                .orElseThrow(() -> new RuntimeException("Enquiry not found: " + enquiryId));
        String refMonth = source.getReferenceMonth();
        Integer monthlySequence = source.getMonthlySequence();
        String abbr = source.getProductAbbr() != null ? source.getProductAbbr() : resolveProductAbbr(source.getProductCode());
        Integer maxSerial = enquiryRepository.findMaxSerialNumber(refMonth, monthlySequence, abbr);
        int nextSerial = (maxSerial == null ? 0 : maxSerial) + 1;
        String refNumber = buildRefNumber(refMonth, monthlySequence, abbr, nextSerial);
        return new ReferencePreview(refNumber, refMonth, monthlySequence, nextSerial, abbr);
    }
    
    // ═══════════════════════════════════
    // 创建询价
    // ═══════════════════════════════════
    
    @Transactional
    public Enquiry createEnquiry(Enquiry enquiry) {
        log.info("Creating new enquiry v3");
        enquiry.setId(null);
        
        // 默认值处理
        if (enquiry.getEnquiryCreatedDate() == null) {
            enquiry.setEnquiryCreatedDate(LocalDateTime.now());
        }
        if (enquiry.getEnquiryReceivedDate() == null) {
            enquiry.setEnquiryReceivedDate(LocalDate.now());
        }
        if (enquiry.getStatus() == null) {
            enquiry.setStatus(Enquiry.EnquiryStatus.New);
        }
        
        // Cargo Ready Date 逻辑
        if (enquiry.getHasSpecificCargoReadyDate() == null) {
            enquiry.setHasSpecificCargoReadyDate(false);
        }
        if (!enquiry.getHasSpecificCargoReadyDate() || enquiry.getCargoReadyDate() == null) {
            enquiry.setCargoReadyDate(enquiry.getEnquiryCreatedDate().toLocalDate());
        }
        
        // OfferType 自动同步 = CargoType
        if (enquiry.getOfferType() == null && enquiry.getCargoTypeCode() != null) {
            try {
                enquiry.setOfferType(Enquiry.OfferType.fromString(enquiry.getCargoTypeCode()));
            } catch (IllegalArgumentException ignored) {}
        }
        
        // Reference Number 生成
        String refMonth = enquiry.getEnquiryCreatedDate().format(DateTimeFormatter.ofPattern("yyMM"));
        enquiry.setReferenceMonth(refMonth);
        if (enquiry.getSerialNumber() == null) enquiry.setSerialNumber(0);
        
        String abbr = resolveProductAbbr(enquiry.getProductCode());
        enquiry.setProductAbbr(abbr);
        
        boolean isIncrease = enquiry.getMonthlySequence() != null
                && enquiry.getSerialNumber() != null
                && enquiry.getSerialNumber() > 0;
        
        if (isIncrease) {
            int seq = enquiry.getMonthlySequence();
            Integer maxSerial = enquiryRepository.findMaxSerialNumber(refMonth, seq, abbr);
            int nextSerial = (maxSerial == null ? 0 : maxSerial) + 1;
            enquiry.setSerialNumber(nextSerial);
            enquiry.setRefNumber(buildRefNumber(refMonth, seq, abbr, nextSerial));
        } else {
            Integer maxSeq = enquiryRepository.findMaxMonthlySequence(refMonth);
            int nextSeq = (maxSeq == null ? 0 : maxSeq) + 1;
            enquiry.setMonthlySequence(nextSeq);
            enquiry.setSerialNumber(0);
            enquiry.setRefNumber(buildRefNumber(refMonth, nextSeq, abbr, 0));
        }
        log.info("Generated ref number: {}", enquiry.getRefNumber());
        
        // ═══ 重要: 先保存 Enquiry (不含 offers) ═══
        // 暂存 offers，先保存 enquiry 和 route groups 拿到真实ID
        List<Offer> pendingOffers = enquiry.getOffers() != null ? new ArrayList<>(enquiry.getOffers()) : new ArrayList<>();
        enquiry.setOffers(new ArrayList<>());
        
        // 保存 Enquiry（无 offers）
        Enquiry saved = enquiryRepository.save(enquiry);
        
        // 保存多港口关联（普通模式）
        if (enquiry.getPolIds() != null && !enquiry.getPolIds().isEmpty()) {
            enquiryPortService.savePolIds(saved.getId(), enquiry.getPolIds());
        }
        if (enquiry.getPodIds() != null && !enquiry.getPodIds().isEmpty()) {
            enquiryPortService.savePodIds(saved.getId(), enquiry.getPodIds());
        }
        
        // ═══ 保存混合模式 RouteGroups 并构建 groupIndex→真实ID 的映射 ═══
        Map<Integer, Long> groupIndexToIdMap = new HashMap<>();
        if (enquiry.getRouteGroups() != null && !enquiry.getRouteGroups().isEmpty()) {
            List<EnquiryRouteGroup> savedGroups = saveRouteGroupsAndReturn(saved.getId(), enquiry.getRouteGroups());
            for (EnquiryRouteGroup sg : savedGroups) {
                groupIndexToIdMap.put(sg.getGroupIndex(), sg.getId());
            }
            log.info("Route group mapping: {}", groupIndexToIdMap);
        }
        
        // ═══ 回填 offers 的 routeGroupId，然后保存 ═══
        if (!pendingOffers.isEmpty()) {
            for (Offer offer : pendingOffers) {
                offer.setId(null);
                offer.setEnquiry(saved);
                if (offer.getSequenceNo() == null) offer.setSequenceNo(1);
                if (offer.getIsLatest() == null) offer.setIsLatest(true);
                
                if (offer.getPriceLines() != null) {
                    for (OfferPriceLine line : offer.getPriceLines()) {
                        line.setId(null);
                        line.setOffer(offer);
                        
                        // 用 sortOrder（携带 groupIndex）回填真实的 routeGroupId
                        if (line.getRouteGroupId() == null && line.getSubMode() != null && !groupIndexToIdMap.isEmpty()) {
                            Integer sortOrder = line.getSortOrder();
                            if (sortOrder != null && groupIndexToIdMap.containsKey(sortOrder)) {
                                line.setRouteGroupId(groupIndexToIdMap.get(sortOrder));
                            }
                        }
                        
                        if (line.getContainerDetails() != null) {
                            for (OfferContainerDetail cd : line.getContainerDetails()) {
                                cd.setId(null);
                                cd.setPriceLine(line);
                            }
                        }
                    }
                }
            }
            saved.setOffers(pendingOffers);
            saved = enquiryRepository.save(saved);
        }
        
        loadTransientData(saved);
        return saved;
    }
    
    // ═══════════════════════════════════
    // 更新询价
    // ═══════════════════════════════════
    
    @Transactional
    public Enquiry updateEnquiry(Long id, Enquiry enquiry) {
        log.info("Updating enquiry v3: {}", id);
        return enquiryRepository.findById(id)
            .map(existing -> {
                // ── 将新值复制到 existing（managed entity）上，保留 JPA 集合引用 ──
                if (enquiry.getRefNumber() != null) existing.setRefNumber(enquiry.getRefNumber());
                if (enquiry.getReferenceMonth() != null) existing.setReferenceMonth(enquiry.getReferenceMonth());
                if (enquiry.getMonthlySequence() != null) existing.setMonthlySequence(enquiry.getMonthlySequence());
                if (enquiry.getSerialNumber() != null) existing.setSerialNumber(enquiry.getSerialNumber());
                if (enquiry.getProductCode() != null) existing.setProductCode(enquiry.getProductCode());
                if (enquiry.getProductAbbr() != null) existing.setProductAbbr(enquiry.getProductAbbr());
                if (enquiry.getCargoTypeCode() != null) existing.setCargoTypeCode(enquiry.getCargoTypeCode());
                if (enquiry.getStatus() != null) existing.setStatus(enquiry.getStatus());
                if (enquiry.getSalesCountryCode() != null) existing.setSalesCountryCode(enquiry.getSalesCountryCode());
                if (enquiry.getSalesPicId() != null) existing.setSalesPicId(enquiry.getSalesPicId());
                if (enquiry.getSalesOfficeId() != null) existing.setSalesOfficeId(enquiry.getSalesOfficeId());
                if (enquiry.getAssignedCnOffice() != null) existing.setAssignedCnOffice(enquiry.getAssignedCnOffice());
                if (enquiry.getEnquiryReceivedDate() != null) existing.setEnquiryReceivedDate(enquiry.getEnquiryReceivedDate());
                if (enquiry.getEnquiryCreatedDate() != null) existing.setEnquiryCreatedDate(enquiry.getEnquiryCreatedDate());
                if (enquiry.getCargoReadyDate() != null) existing.setCargoReadyDate(enquiry.getCargoReadyDate());
                if (enquiry.getHasSpecificCargoReadyDate() != null) existing.setHasSpecificCargoReadyDate(enquiry.getHasSpecificCargoReadyDate());
                existing.setCoreNonCore(enquiry.getCoreNonCore());
                existing.setCategory(enquiry.getCategory());
                existing.setCommodity(enquiry.getCommodity());
                existing.setVolumeCbm(enquiry.getVolumeCbm());
                existing.setQuantity(enquiry.getQuantity());
                existing.setUom(enquiry.getUom());
                existing.setHazardousSpecialEquipment(enquiry.getHazardousSpecialEquipment());
                existing.setIsOversizeCargo(enquiry.getIsOversizeCargo());
                existing.setExwLocation(enquiry.getExwLocation());
                existing.setPodCountry(enquiry.getPodCountry());
                existing.setRemark(enquiry.getRemark());
                existing.setCargoReadyDateDetails(enquiry.getCargoReadyDateDetails());
                existing.setOfferType(enquiry.getOfferType());
                if (enquiry.getCancelledReason() != null) existing.setCancelledReason(enquiry.getCancelledReason());
                if (enquiry.getCancelledReasonText() != null) existing.setCancelledReasonText(enquiry.getCancelledReasonText());
                if (enquiry.getLostReason() != null) existing.setLostReason(enquiry.getLostReason());
                if (enquiry.getLostReasonText() != null) existing.setLostReasonText(enquiry.getLostReasonText());
                
                // ── 更新港口关联 ──
                if (enquiry.getPolIds() != null) {
                    enquiryPortService.savePolIds(existing.getId(), enquiry.getPolIds());
                }
                if (enquiry.getPodIds() != null) {
                    enquiryPortService.savePodIds(existing.getId(), enquiry.getPodIds());
                }
                
                // ── Offers + RouteGroups 处理（顺序关键：先删 offers → 再删 route groups → 再建） ──
                List<Offer> pendingOffers = new ArrayList<>();
                boolean hasNewOffers = enquiry.getOffers() != null && !enquiry.getOffers().isEmpty();
                if (hasNewOffers) {
                    pendingOffers.addAll(enquiry.getOffers());
                }
                
                // Step 1: 清空旧 offers（释放 route_group_id FK 引用）
                if (hasNewOffers) {
                    existing.getOffers().clear();
                    enquiryRepository.saveAndFlush(existing); // 确保 DELETE offer_price_line 执行完
                }
                
                // Step 2: 删旧 route groups → 建新的 → 拿真实 ID
                Map<Integer, Long> groupIndexToIdMap = new HashMap<>();
                if (enquiry.getRouteGroups() != null) {
                    routeGroupRepository.deleteByEnquiryId(existing.getId());
                    routeGroupRepository.flush();
                    if (!enquiry.getRouteGroups().isEmpty()) {
                        List<EnquiryRouteGroup> savedGroups = saveRouteGroupsAndReturn(existing.getId(), enquiry.getRouteGroups());
                        for (EnquiryRouteGroup sg : savedGroups) {
                            groupIndexToIdMap.put(sg.getGroupIndex(), sg.getId());
                        }
                    }
                }
                
                // Step 3: 添加新 offers，回填 routeGroupId
                if (!pendingOffers.isEmpty()) {
                    for (Offer offer : pendingOffers) {
                        offer.setId(null);
                        offer.setEnquiry(existing);
                        if (offer.getPriceLines() != null) {
                            for (var line : offer.getPriceLines()) {
                                line.setId(null);
                                line.setOffer(offer);
                                // 更新模式：route groups 已被删除重建，
                                // 所以所有旧的 routeGroupId 都已失效，必须用 sortOrder 重新映射
                                if (!groupIndexToIdMap.isEmpty() && line.getSortOrder() != null) {
                                    Long realId = groupIndexToIdMap.get(line.getSortOrder());
                                    line.setRouteGroupId(realId);
                                } else {
                                    line.setRouteGroupId(null);
                                }
                                if (line.getContainerDetails() != null) {
                                    line.getContainerDetails().forEach(cd -> {
                                        cd.setId(null);
                                        cd.setPriceLine(line);
                                    });
                                }
                            }
                        }
                        existing.getOffers().add(offer);
                    }
                }
                
                Enquiry updated = enquiryRepository.save(existing);
                loadTransientData(updated);
                return updated;
            })
            .orElseThrow(() -> new RuntimeException("Enquiry not found: " + id));
    }
    
    // ═══════════════════════════════════
    // 状态变更
    // ═══════════════════════════════════
    
    @Transactional
    public Enquiry changeStatus(Long id, String newStatus, String reason, String reasonText) {
        log.info("Changing status of enquiry {} to {}", id, newStatus);
        Enquiry enquiry = enquiryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Enquiry not found: " + id));
        
        Enquiry.EnquiryStatus targetStatus = Enquiry.EnquiryStatus.fromString(newStatus);
        
        // 状态流转校验
        validateStatusTransition(enquiry.getStatus(), targetStatus);
        
        enquiry.setStatus(targetStatus);
        
        switch (targetStatus) {
            case Cancelled:
                if (reason == null || reason.isBlank()) {
                    throw new RuntimeException("Cancelled reason is required");
                }
                enquiry.setCancelledReason(reason);
                enquiry.setCancelledReasonText(reasonText);
                // 清除 lost reason
                enquiry.setLostReason(null);
                enquiry.setLostReasonText(null);
                break;
            case Lost:
                if (reason == null || reason.isBlank()) {
                    throw new RuntimeException("Lost reason is required");
                }
                enquiry.setLostReason(reason);
                enquiry.setLostReasonText(reasonText);
                // 清除 cancelled reason
                enquiry.setCancelledReason(null);
                enquiry.setCancelledReasonText(null);
                break;
            default:
                // 转到 New / Quoted & Pending / Secured 时，清除两种 reason
                enquiry.setCancelledReason(null);
                enquiry.setCancelledReasonText(null);
                enquiry.setLostReason(null);
                enquiry.setLostReasonText(null);
                break;
        }
        
        return enquiryRepository.save(enquiry);
    }
    
    private void validateStatusTransition(Enquiry.EnquiryStatus from, Enquiry.EnquiryStatus to) {
        if (from == to) {
            throw new RuntimeException("Status is already: " + from);
        }
        
        // 任意状态 → Cancelled 始终允许
        if (to == Enquiry.EnquiryStatus.Cancelled) return;
        
        // 有效流转规则
        switch (from) {
            case New:
                // New → Quoted & Pending
                if (to != Enquiry.EnquiryStatus.Quoted_Pending) {
                    throw new RuntimeException("Invalid transition: " + from + " → " + to);
                }
                break;
            case Quoted_Pending:
                // Quoted & Pending → Secured / Lost
                if (to != Enquiry.EnquiryStatus.Secured && to != Enquiry.EnquiryStatus.Lost) {
                    throw new RuntimeException("Invalid transition: " + from + " → " + to);
                }
                break;
            case Secured:
                // Secured → Lost (允许)
                if (to != Enquiry.EnquiryStatus.Lost) {
                    throw new RuntimeException("Invalid transition: " + from + " → " + to);
                }
                break;
            case Lost:
                // Lost → New / Quoted & Pending (允许重新激活)
                if (to != Enquiry.EnquiryStatus.New && to != Enquiry.EnquiryStatus.Quoted_Pending) {
                    throw new RuntimeException("Invalid transition: " + from + " → " + to);
                }
                break;
            case Cancelled:
                // Cancelled → New / Quoted & Pending (允许重新激活)
                if (to != Enquiry.EnquiryStatus.New && to != Enquiry.EnquiryStatus.Quoted_Pending) {
                    throw new RuntimeException("Invalid transition: " + from + " → " + to);
                }
                break;
            default:
                throw new RuntimeException("Cannot change status from: " + from);
        }
    }
    
    // ═══════════════════════════════════
    // 删除
    // ═══════════════════════════════════
    
    @Transactional
    public void deleteEnquiry(Long id) {
        log.info("Deleting enquiry: {}", id);
        if (!enquiryRepository.existsById(id)) {
            throw new RuntimeException("Enquiry not found: " + id);
        }
        enquiryRepository.deleteById(id);
    }
    
    // ═══════════════════════════════════
    // 内部辅助方法
    // ═══════════════════════════════════
    
    /**
     * 加载 Transient 数据（polIds, podIds, routeGroups）
     */
    private void loadTransientData(Enquiry enquiry) {
        if (enquiry.getId() == null) return;
        enquiry.setPolIds(enquiryPortService.getPolIds(enquiry.getId()));
        enquiry.setPodIds(enquiryPortService.getPodIds(enquiry.getId()));
        
        // 加载 Route Groups
        List<EnquiryRouteGroup> groups = routeGroupRepository.findByEnquiryIdOrderByGroupIndex(enquiry.getId());
        groups.forEach(g -> {
            g.setPolIds(routeGroupPolRepository.findByRouteGroupId(g.getId())
                    .stream().map(EnquiryRouteGroupPol::getPortId).collect(Collectors.toList()));
            g.setPodIds(routeGroupPodRepository.findByRouteGroupId(g.getId())
                    .stream().map(EnquiryRouteGroupPod::getPortId).collect(Collectors.toList()));
        });
        enquiry.setRouteGroups(groups);
    }
    
    /**
     * 保存混合模式 Route Groups（返回已保存的列表，含真实 ID）
     */
    private List<EnquiryRouteGroup> saveRouteGroupsAndReturn(Long enquiryId, List<EnquiryRouteGroup> groups) {
        List<EnquiryRouteGroup> savedList = new ArrayList<>();
        for (EnquiryRouteGroup group : groups) {
            group.setId(null);
            group.setEnquiryId(enquiryId);
            EnquiryRouteGroup savedGroup = routeGroupRepository.save(group);
            savedList.add(savedGroup);

            // 保存 POLs
            if (group.getPolIds() != null) {
                group.getPolIds().forEach(portId -> {
                    EnquiryRouteGroupPol pol = new EnquiryRouteGroupPol();
                    pol.setRouteGroupId(savedGroup.getId());
                    pol.setPortId(portId);
                    routeGroupPolRepository.save(pol);
                });
            }

            // 保存 PODs
            if (group.getPodIds() != null) {
                group.getPodIds().forEach(portId -> {
                    EnquiryRouteGroupPod pod = new EnquiryRouteGroupPod();
                    pod.setRouteGroupId(savedGroup.getId());
                    pod.setPortId(portId);
                    routeGroupPodRepository.save(pod);
                });
            }
        }
        return savedList;
    }

    /**
     * 保存混合模式 Route Groups（void 版本，用于 update）
     */
    private void saveRouteGroups(Long enquiryId, List<EnquiryRouteGroup> groups) {
        for (EnquiryRouteGroup group : groups) {
            group.setId(null);
            group.setEnquiryId(enquiryId);
            EnquiryRouteGroup savedGroup = routeGroupRepository.save(group);
            
            // 保存 POLs
            if (group.getPolIds() != null) {
                group.getPolIds().forEach(portId -> {
                    EnquiryRouteGroupPol pol = new EnquiryRouteGroupPol();
                    pol.setRouteGroupId(savedGroup.getId());
                    pol.setPortId(portId);
                    routeGroupPolRepository.save(pol);
                });
            }
            
            // 保存 PODs
            if (group.getPodIds() != null) {
                group.getPodIds().forEach(portId -> {
                    EnquiryRouteGroupPod pod = new EnquiryRouteGroupPod();
                    pod.setRouteGroupId(savedGroup.getId());
                    pod.setPortId(portId);
                    routeGroupPodRepository.save(pod);
                });
            }
        }
    }
}
