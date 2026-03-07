package com.logitrack.backend.service;

import com.logitrack.backend.dto.ReferencePreview;
import com.logitrack.backend.entity.Enquiry;
import com.logitrack.backend.entity.Country;
import com.logitrack.backend.entity.Port;
import com.logitrack.backend.repository.EnquiryRepository;
import com.logitrack.backend.repository.ProductRepository;
import com.logitrack.backend.repository.ContainerTypeRepository;
import com.logitrack.backend.repository.CountryRepository;
import com.logitrack.backend.repository.PortRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.logitrack.backend.entity.EnquiryContainerLine;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.ArrayList;
import java.util.Set;
import java.util.HashSet;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class EnquiryService {
    
    private final EnquiryRepository enquiryRepository;
    private final ProductRepository productRepository;
    private final ContainerTypeRepository containerTypeRepository;
    private final EnquiryPortService enquiryPortService;  // ✅ 新增：多港口服务
    private final CountryRepository countryRepository;
    private final PortRepository portRepository;
    
    /**
     * Get all enquiry records
     */
    public List<Enquiry> getAllEnquiries() {
        log.debug("Fetching all enquiry records");
        List<Enquiry> enquiries = enquiryRepository.findAll();
        
        // ✅ 为每个 Enquiry 加载多港口数据
        enquiries.forEach(e -> {
            e.setPolIds(enquiryPortService.getPolIds(e.getId()));
            e.setPodIds(enquiryPortService.getPodIds(e.getId()));
        });
        
        return enquiries;
    }
    
    /**
     * Get enquiries with pagination
     */
    public Page<Enquiry> getEnquiries(Pageable pageable) {
        log.debug("Fetching enquiries with pagination");
        Page<Enquiry> page = enquiryRepository.findAll(pageable);
        
        // ✅ 为每个 Enquiry 加载多港口数据
        page.getContent().forEach(e -> {
            e.setPolIds(enquiryPortService.getPolIds(e.getId()));
            e.setPodIds(enquiryPortService.getPodIds(e.getId()));
        });
        
        return page;
    }
    
    /**
     * Search enquiries with keyword
     */
    public Page<Enquiry> searchEnquiries(String keyword, Pageable pageable) {
        log.debug("Searching enquiries with keyword: {}", keyword);
        return enquiryRepository.searchEnquiries(keyword, pageable);
    }
    
    /**
     * Get enquiry by ID
     */
    public Optional<Enquiry> getEnquiryById(Long id) {
        log.debug("Fetching enquiry with id: {}", id);
        Optional<Enquiry> enquiry = enquiryRepository.findById(id);
        
        // ✅ 加载多港口数据
        enquiry.ifPresent(e -> {
            e.setPolIds(enquiryPortService.getPolIds(id));
            e.setPodIds(enquiryPortService.getPodIds(id));
        });
        
        return enquiry;
    }
    
    /**
     * Get enquiry by reference number
     */
    public Optional<Enquiry> getEnquiryByReferenceNumber(String referenceNumber) {
        log.debug("Fetching enquiry with reference number: {}", referenceNumber);
        return enquiryRepository.findByReferenceNumber(referenceNumber);
    }

    private String resolveProductAbbr(String productCode) {
        if (productCode == null) return "X";
        return productRepository.findById(productCode)
                .map(com.logitrack.backend.entity.Product::getAbbr)
                .orElse("X");
    }

    private String buildReferenceNumber(String refMonth, int seq, String abbr, int serialNumber) {
        return String.format("CN%s%03d-%s%s",
                refMonth,
                seq,
                abbr,
                serialNumber > 0 ? String.valueOf(serialNumber) : "");
    }

    /**
     * Calculate CORE/NON-CORE flag based on POD countries
     * 根据POD国家自动判断CORE/NON-CORE标志
     * 规则：如果存在混合情况（既有CORE又有NON-CORE国家），返回null表示需要手动选择
     * 
     * @param podIds POD港口ID列表
     * @return CoreFlag枚举值，如果混合则返回null
     */
    private Enquiry.CoreFlag calculateCoreFlagFromPods(List<Integer> podIds) {
        if (podIds == null || podIds.isEmpty()) {
            log.debug("No POD IDs provided, cannot determine CORE flag");
            return null;
        }

        // 获取所有POD的国家信息
        Set<String> countryCodes = new HashSet<>();
        for (Integer podId : podIds) {
            Optional<Port> port = portRepository.findById(podId);
            if (port.isPresent() && port.get().getCountryCode() != null) {
                countryCodes.add(port.get().getCountryCode());
            }
        }

        if (countryCodes.isEmpty()) {
            log.debug("No country codes found for PODs, cannot determine CORE flag");
            return null;
        }

        // 查询这些国家的is_core属性
        boolean hasCore = false;
        boolean hasNonCore = false;
        
        for (String countryCode : countryCodes) {
            Optional<Country> country = countryRepository.findByCountryCode(countryCode);
            if (country.isPresent()) {
                if (country.get().getIsCore()) {
                    hasCore = true;
                } else {
                    hasNonCore = true;
                }
            }
        }

        // 混合情况：既有CORE又有NON-CORE
        if (hasCore && hasNonCore) {
            log.warn("Mixed CORE/NON-CORE countries detected for PODs: {}. Requires manual selection.", countryCodes);
            return null; // 需要用户手动选择
        }

        // 纯CORE或纯NON-CORE
        if (hasCore) {
            log.debug("All POD countries are CORE");
            return Enquiry.CoreFlag.CORE;
        } else {
            log.debug("All POD countries are NON-CORE");
            return Enquiry.CoreFlag.NON_CORE;
        }
    }

    public ReferencePreview getNextReference(LocalDate issueDate, String productCode) {
        LocalDate effectiveDate = issueDate != null ? issueDate : LocalDate.now();
        DateTimeFormatter fm = DateTimeFormatter.ofPattern("yyMM");
        String refMonth = effectiveDate.format(fm);
        String abbr = resolveProductAbbr(productCode);
        Integer maxSeq = enquiryRepository.findMaxMonthlySequence(refMonth);
        int nextSeq = (maxSeq == null ? 0 : maxSeq) + 1;
        String refNumber = buildReferenceNumber(refMonth, nextSeq, abbr, 0);
        return new ReferencePreview(refNumber, refMonth, nextSeq, 0, abbr);
    }

    public ReferencePreview getNextIncreaseReference(Long enquiryId) {
        Enquiry source = enquiryRepository.findById(enquiryId)
                .orElseThrow(() -> new RuntimeException("Enquiry not found"));
        String refMonth = source.getReferenceMonth();
        Integer monthlySequence = source.getMonthlySequence();
        String abbr = source.getProductAbbr() != null ? source.getProductAbbr() : resolveProductAbbr(source.getProductCode());
        Integer maxSerial = enquiryRepository.findMaxSerialNumber(refMonth, monthlySequence, abbr);
        int nextSerial = (maxSerial == null ? 0 : maxSerial) + 1;
        String refNumber = buildReferenceNumber(refMonth, monthlySequence, abbr, nextSerial);
        return new ReferencePreview(refNumber, refMonth, monthlySequence, nextSerial, abbr);
    }
    
    /**
     * Create new enquiry record
     */
    @Transactional
    public Enquiry createEnquiry(Enquiry enquiry) {
        log.info("Creating new enquiry record (service)");

        // Ensure new entity
        enquiry.setId(null);

        // Ensure issueDate exists
        if (enquiry.getIssueDate() == null) {
            enquiry.setIssueDate(java.time.LocalDate.now());
        }
        
        // ✅ 设置所有必填字段的默认值
        if (enquiry.getAssignedCnOfficeCode() == null || enquiry.getAssignedCnOfficeCode().isEmpty()) {
            enquiry.setAssignedCnOfficeCode("SHANGHAI");
        }
        if (enquiry.getCargoTypeCode() == null || enquiry.getCargoTypeCode().isEmpty()) {
            enquiry.setCargoTypeCode("FCL");
        }
        if (enquiry.getCnPricingAdmin() == null || enquiry.getCnPricingAdmin().isEmpty()) {
            enquiry.setCnPricingAdmin("SYSTEM_ADMIN");
        }
        if (enquiry.getSalesCountryCode() == null || enquiry.getSalesCountryCode().isEmpty()) {
            enquiry.setSalesCountryCode("CN");
        }
        // ✅ 修复：空字符串的 categoryCode 需转为 null，否则触发 fk_enquiry_category 外键约束失败
        if (enquiry.getCategoryCode() != null && enquiry.getCategoryCode().isEmpty()) {
            enquiry.setCategoryCode(null);
        }
        if (enquiry.getSalesOfficeId() == null) {
            // 不再硬编码1，让数据库允许NULL
        }
        // ✅ 修复：polId/podId 优先从 polIds/podIds 数组取第一个，避免 FK 约束违反
        if (enquiry.getPolId() == null) {
            if (enquiry.getPolIds() != null && !enquiry.getPolIds().isEmpty()) {
                enquiry.setPolId(enquiry.getPolIds().get(0));
            }
            // 若 polIds 也为空，保持 null（数据库列允许 null）
        }
        if (enquiry.getPodId() == null) {
            if (enquiry.getPodIds() != null && !enquiry.getPodIds().isEmpty()) {
                enquiry.setPodId(enquiry.getPodIds().get(0));
            }
            // 若 podIds 也为空，保持 null（数据库列允许 null）
        }
        if (enquiry.getBookingConfirmed() == null) {
            enquiry.setBookingConfirmed(com.logitrack.backend.entity.Enquiry.BookingConfirmed.Pending);
        }
        if (enquiry.getStatus() == null) {
            enquiry.setStatus(com.logitrack.backend.entity.Enquiry.EnquiryStatus.New);
        }
        if (enquiry.getEnquiryReceivedDate() == null) {
            enquiry.setEnquiryReceivedDate(java.time.LocalDate.now());
        }

        // Reference month YYMM
        DateTimeFormatter fm = DateTimeFormatter.ofPattern("yyMM");
        String refMonth = enquiry.getIssueDate().format(fm);
        enquiry.setReferenceMonth(refMonth);

        // serial number default
        if (enquiry.getSerialNumber() == null) enquiry.setSerialNumber(0);

        // product abbr lookup
        String abbr = resolveProductAbbr(enquiry.getProductCode());
        enquiry.setProductAbbr(abbr);

        // Handle container lines and compute TEU aggregate
        // ✅ 修复：合并相同箱型的行，避免 uk_enquiry_container 唯一约束冲突
        if (enquiry.getContainerLines() != null && !enquiry.getContainerLines().isEmpty()) {
            enquiry.setContainerLines(mergeContainerLines(enquiry.getContainerLines()));
        }
        java.math.BigDecimal totalTeu = java.math.BigDecimal.ZERO;
        if (enquiry.getContainerLines() != null && !enquiry.getContainerLines().isEmpty()) {
            for (EnquiryContainerLine line : enquiry.getContainerLines()) {
                // ✅ 关键修复：确保新实体没有ID（防止detached entity异常）
                line.setId(null);
                
                // link to parent
                line.setEnquiry(enquiry);

                // if containerQty null try to use a generic quantity field
                if (line.getContainerQty() == null) {
                    // try reflection compatibility: some payloads send 'quantity' instead
                    try {
                        java.lang.reflect.Field qf = line.getClass().getDeclaredField("quantity");
                        qf.setAccessible(true);
                        Object qv = qf.get(line);
                        if (qv instanceof Number) {
                            line.setContainerQty(((Number) qv).intValue());
                        }
                    } catch (NoSuchFieldException | IllegalAccessException ignored) {
                    }
                }

                int qty = line.getContainerQty() != null ? line.getContainerQty() : 0;
                java.math.BigDecimal teu = java.math.BigDecimal.ZERO;
                
                // ✅ 关键修复：填充containerCode和teuPerUnit (数据库NOT NULL字段)
                if (line.getContainerTypeId() != null) {
                    Optional<com.logitrack.backend.entity.ContainerType> maybeCt = containerTypeRepository.findById(line.getContainerTypeId());
                    if (maybeCt.isPresent()) {
                        com.logitrack.backend.entity.ContainerType ct = maybeCt.get();
                        
                        // 填充containerCode (必填字段)
                        if (line.getContainerCode() == null || line.getContainerCode().isEmpty()) {
                            line.setContainerCode(ct.getContainerCode());
                        }
                        
                        // 填充teuPerUnit (必填字段，默认1.00)
                        if (line.getTeuPerUnit() == null) {
                            java.math.BigDecimal teuValue = ct.getTeuValue() != null ? ct.getTeuValue() : java.math.BigDecimal.ONE;
                            line.setTeuPerUnit(teuValue);
                        }
                        
                        // 计算总TEU
                        java.math.BigDecimal t = ct.getTeuValue() != null ? ct.getTeuValue() : java.math.BigDecimal.ZERO;
                        totalTeu = totalTeu.add(t.multiply(java.math.BigDecimal.valueOf(qty)));
                    }
                }
            }
        }
        enquiry.setQuantityTeu(totalTeu);

        // ✅ 处理报价（Offer），避免detached entity异常
        if (enquiry.getOffers() != null && !enquiry.getOffers().isEmpty()) {
            enquiry.getOffers().forEach(offer -> {
                offer.setId(null);
                offer.setEnquiry(enquiry);
                if (offer.getSequenceNo() == null) {
                    offer.setSequenceNo(1);
                }
                if (offer.getIsLatest() == null) {
                    offer.setIsLatest(true);
                }
            });
        } else if (enquiry.getOffers() == null) {
            enquiry.setOffers(new ArrayList<>());
        }

        // ✅ 自动计算CORE/NON-CORE flag（如果未手动设置）
        if (enquiry.getCoreFlag() == null && enquiry.getPodIds() != null && !enquiry.getPodIds().isEmpty()) {
            Enquiry.CoreFlag calculatedFlag = calculateCoreFlagFromPods(enquiry.getPodIds());
            if (calculatedFlag != null) {
                enquiry.setCoreFlag(calculatedFlag);
                log.info("Auto-calculated CORE flag: {}", calculatedFlag);
            } else {
                log.warn("Mixed CORE/NON-CORE countries detected. User must manually select CORE flag.");
            }
        }

        // ✅ 修复：将参考编号计算移到事务/save之前（在任何JPA操作前），
        //   防止 DataIntegrityViolationException 后 session 损坏，再次查询触发 AssertionFailure
        boolean isIncrease = enquiry.getMonthlySequence() != null && enquiry.getSerialNumber() != null && enquiry.getSerialNumber() > 0;
        if (isIncrease) {
            int seq = enquiry.getMonthlySequence();
            Integer maxSerial = enquiryRepository.findMaxSerialNumber(refMonth, seq, abbr);
            int nextSerial = (maxSerial == null ? 0 : maxSerial) + 1;
            enquiry.setSerialNumber(nextSerial);
            enquiry.setReferenceNumber(buildReferenceNumber(refMonth, seq, abbr, nextSerial));
        } else {
            Integer maxSeq = enquiryRepository.findMaxMonthlySequence(refMonth);
            int nextSeq = (maxSeq == null ? 0 : maxSeq) + 1;
            enquiry.setMonthlySequence(nextSeq);
            enquiry.setSerialNumber(0);
            enquiry.setReferenceNumber(buildReferenceNumber(refMonth, nextSeq, abbr, 0));
        }
        log.info("Calculated reference number: {}", enquiry.getReferenceNumber());

        // ✅ 保存 Enquiry 实体（不再在事务内循环重试，避免 session 损坏后 AssertionFailure）
        Enquiry savedEnquiry = enquiryRepository.save(enquiry);

        // ✅ 保存多港口关联（如果有 polIds/podIds）
        if (enquiry.getPolIds() != null && !enquiry.getPolIds().isEmpty()) {
            enquiryPortService.savePolIds(savedEnquiry.getId(), enquiry.getPolIds());
            log.info("Saved {} POL(s) for new enquiry {}", enquiry.getPolIds().size(), savedEnquiry.getId());
        }
        if (enquiry.getPodIds() != null && !enquiry.getPodIds().isEmpty()) {
            enquiryPortService.savePodIds(savedEnquiry.getId(), enquiry.getPodIds());
            log.info("Saved {} POD(s) for new enquiry {}", enquiry.getPodIds().size(), savedEnquiry.getId());
        }

        return savedEnquiry;
    }
    
    /**
     * Update existing enquiry record
     */
    @Transactional
    public Enquiry updateEnquiry(Long id, Enquiry enquiry) {
        log.info("Updating enquiry record with id: {}", id);
        return enquiryRepository.findById(id)
            .map(existing -> {
                // attach id
                enquiry.setId(id);
                
                // ✅ 保留必填字段（防止更新时变为null）
                // 基本信息
                if (enquiry.getReferenceMonth() == null) {
                    enquiry.setReferenceMonth(existing.getReferenceMonth());
                }
                if (enquiry.getMonthlySequence() == null) {
                    enquiry.setMonthlySequence(existing.getMonthlySequence());
                }
                if (enquiry.getSerialNumber() == null) {
                    enquiry.setSerialNumber(existing.getSerialNumber());
                }
                if (enquiry.getReferenceNumber() == null || enquiry.getReferenceNumber().isEmpty()) {
                    enquiry.setReferenceNumber(existing.getReferenceNumber());
                }
                
                // ✅ 新增：保留其他重要必填字段
                if (enquiry.getProductCode() == null || enquiry.getProductCode().isEmpty()) {
                    enquiry.setProductCode(existing.getProductCode());
                }
                if (enquiry.getProductAbbr() == null || enquiry.getProductAbbr().isEmpty()) {
                    enquiry.setProductAbbr(existing.getProductAbbr());
                }
                if (enquiry.getStatus() == null) {
                    enquiry.setStatus(existing.getStatus());
                }
                if (enquiry.getCnPricingAdmin() == null || enquiry.getCnPricingAdmin().isEmpty()) {
                    enquiry.setCnPricingAdmin(existing.getCnPricingAdmin());
                }
                if (enquiry.getSalesCountryCode() == null || enquiry.getSalesCountryCode().isEmpty()) {
                    enquiry.setSalesCountryCode(existing.getSalesCountryCode());
                }
                if (enquiry.getSalesOfficeId() == null) {
                    enquiry.setSalesOfficeId(existing.getSalesOfficeId());
                }
                if (enquiry.getSalesPicId() == null) {
                    enquiry.setSalesPicId(existing.getSalesPicId());
                }
                if (enquiry.getAssignedCnOfficeCode() == null || enquiry.getAssignedCnOfficeCode().isEmpty()) {
                    enquiry.setAssignedCnOfficeCode(existing.getAssignedCnOfficeCode());
                }
                if (enquiry.getCargoTypeCode() == null || enquiry.getCargoTypeCode().isEmpty()) {
                    enquiry.setCargoTypeCode(existing.getCargoTypeCode());
                }
                // ✅ 修复：空字符串的 categoryCode 需转为 null，否则触发 fk_enquiry_category 外键约束失败
                if (enquiry.getCategoryCode() != null && enquiry.getCategoryCode().isEmpty()) {
                    enquiry.setCategoryCode(null);
                }
                if (enquiry.getIssueDate() == null) {
                    enquiry.setIssueDate(existing.getIssueDate());
                }
                if (enquiry.getEnquiryReceivedDate() == null) {
                    enquiry.setEnquiryReceivedDate(existing.getEnquiryReceivedDate());
                }
                if (enquiry.getPolId() == null) {
                    enquiry.setPolId(existing.getPolId());
                }
                if (enquiry.getPodId() == null) {
                    enquiry.setPodId(existing.getPodId());
                }

                // ✅ 更新时保留现有的offers（避免detached entity）
                if (enquiry.getOffers() == null || enquiry.getOffers().isEmpty()) {
                    enquiry.setOffers(existing.getOffers());
                } else {
                    enquiry.getOffers().forEach(offer -> {
                        offer.setEnquiry(enquiry);
                    });
                }

                // ✅ 处理 containerLines 更新
                java.math.BigDecimal totalTeu = java.math.BigDecimal.ZERO;
                if (enquiry.getContainerLines() == null || enquiry.getContainerLines().isEmpty()) {
                    // 没有传入 containerLines，保留原有的
                    enquiry.setContainerLines(existing.getContainerLines());
                    // 使用原有的 TEU
                    totalTeu = existing.getQuantityTeu() != null ? existing.getQuantityTeu() : java.math.BigDecimal.ZERO;
                } else {
                    // ✅ 传入了新的 containerLines，先清空旧的（通过 JPA 删除）
                    if (existing.getContainerLines() != null && !existing.getContainerLines().isEmpty()) {
                        existing.getContainerLines().clear();
                        enquiryRepository.flush();  // 立即执行删除
                    }
                    
                    // ✅ 修复：合并相同箱型的行，避免 uk_enquiry_container 唯一约束冲突
                    List<EnquiryContainerLine> mergedLines = mergeContainerLines(enquiry.getContainerLines());
                    enquiry.setContainerLines(mergedLines);
                    // 然后添加新的 containerLines
                    for (EnquiryContainerLine line : mergedLines) {
                        line.setId(null);  // 确保作为新行插入
                        line.setEnquiry(enquiry);
                        
                        int qty = line.getContainerQty() != null ? line.getContainerQty() : 0;
                        if (line.getContainerTypeId() != null) {
                            Optional<com.logitrack.backend.entity.ContainerType> maybeCt3 = containerTypeRepository.findById(line.getContainerTypeId());
                            if (maybeCt3.isPresent()) {
                                com.logitrack.backend.entity.ContainerType ct3 = maybeCt3.get();

                                // 填充containerCode (必填字段)
                                if (line.getContainerCode() == null || line.getContainerCode().isEmpty()) {
                                    line.setContainerCode(ct3.getContainerCode());
                                }

                                // 填充teuPerUnit (必填字段)
                                if (line.getTeuPerUnit() == null) {
                                    java.math.BigDecimal teuValue = ct3.getTeuValue() != null ? ct3.getTeuValue() : java.math.BigDecimal.ONE;
                                    line.setTeuPerUnit(teuValue);
                                }

                                java.math.BigDecimal t3 = ct3.getTeuValue() != null ? ct3.getTeuValue() : java.math.BigDecimal.ZERO;
                                totalTeu = totalTeu.add(t3.multiply(java.math.BigDecimal.valueOf(qty)));
                            }
                        }
                    }
                }
                enquiry.setQuantityTeu(totalTeu);

                // ✅ 自动计算CORE/NON-CORE flag（如果POD有变更且未手动设置）
                if (enquiry.getPodIds() != null && !enquiry.getPodIds().isEmpty()) {
                    // 只有在coreFlag为null或POD发生变化时才重新计算
                    List<Integer> existingPodIds = enquiryPortService.getPodIds(existing.getId());
                    boolean podChanged = !enquiry.getPodIds().equals(existingPodIds);
                    
                    if (podChanged && enquiry.getCoreFlag() == null) {
                        Enquiry.CoreFlag calculatedFlag = calculateCoreFlagFromPods(enquiry.getPodIds());
                        if (calculatedFlag != null) {
                            enquiry.setCoreFlag(calculatedFlag);
                            log.info("Auto-calculated CORE flag after POD change: {}", calculatedFlag);
                        } else {
                            log.warn("Mixed CORE/NON-CORE countries detected after POD change. User must manually select CORE flag.");
                        }
                    }
                } else if (enquiry.getCoreFlag() == null) {
                    // 保留原有的coreFlag
                    enquiry.setCoreFlag(existing.getCoreFlag());
                }

                // ✅ 保存 Enquiry 实体
                Enquiry updatedEnquiry = enquiryRepository.save(enquiry);
                
                // ✅ 更新多港口关联（如果提供了 polIds/podIds，即使是空数组也更新）
                if (enquiry.getPolIds() != null) {
                    enquiryPortService.savePolIds(updatedEnquiry.getId(), enquiry.getPolIds());
                    log.info("Updated {} POL(s) for enquiry {}", enquiry.getPolIds().size(), updatedEnquiry.getId());
                }
                if (enquiry.getPodIds() != null) {
                    enquiryPortService.savePodIds(updatedEnquiry.getId(), enquiry.getPodIds());
                    log.info("Updated {} POD(s) for enquiry {}", enquiry.getPodIds().size(), updatedEnquiry.getId());
                }
                
                // ✅ 重新加载港口数据以返回给前端
                updatedEnquiry.setPolIds(enquiryPortService.getPolIds(updatedEnquiry.getId()));
                updatedEnquiry.setPodIds(enquiryPortService.getPodIds(updatedEnquiry.getId()));
                
                return updatedEnquiry;
            })
            .orElseThrow(() -> new RuntimeException("Enquiry record not found with id: " + id));
    }
    
    /**
     * 合并相同箱型的集装箱行，将 container_type_id 相同的行按数量累加，
     * 避免违反 uk_enquiry_container (enquiry_id, container_type_id) 唯一约束。
     * 例如：两行 20FR (qty=1, qty=2) → 一行 20FR (qty=3)
     */
    private List<EnquiryContainerLine> mergeContainerLines(List<EnquiryContainerLine> lines) {
        if (lines == null || lines.isEmpty()) return lines;
        java.util.LinkedHashMap<Integer, EnquiryContainerLine> mergedMap = new java.util.LinkedHashMap<>();
        for (EnquiryContainerLine line : lines) {
            Integer typeId = line.getContainerTypeId();
            if (typeId == null) {
                // 无法合并，保留原行
                mergedMap.put(System.identityHashCode(line), line);
                continue;
            }
            if (mergedMap.containsKey(typeId)) {
                EnquiryContainerLine existing = mergedMap.get(typeId);
                int existingQty = existing.getContainerQty() != null ? existing.getContainerQty() : 0;
                int addQty = line.getContainerQty() != null ? line.getContainerQty() : 0;
                existing.setContainerQty(existingQty + addQty);
                log.info("Merged duplicate container type {} rows: qty {} + {} = {}",
                        typeId, existingQty, addQty, existingQty + addQty);
            } else {
                mergedMap.put(typeId, line);
            }
        }
        return new java.util.ArrayList<>(mergedMap.values());
    }

    /**
     * Delete enquiry record
     */
    @Transactional
    public void deleteEnquiry(Long id) {
        log.info("Deleting enquiry record with id: {}", id);
        
        if (!enquiryRepository.existsById(id)) {
            throw new RuntimeException("Enquiry record not found with id: " + id);
        }
        
        enquiryRepository.deleteById(id);
    }
    
    /**
     * Get enquiries by status
     */
    public List<Enquiry> getEnquiriesByStatus(Enquiry.EnquiryStatus status) {
        log.debug("Fetching enquiries with status: {}", status);
        return enquiryRepository.findByStatus(status);
    }
    
    /**
     * Count enquiries by status
     */
    public long countByStatus(Enquiry.EnquiryStatus status) {
        return enquiryRepository.countByStatus(status);
    }
}
