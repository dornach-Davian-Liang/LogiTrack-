package com.logitrack.backend.service;

import com.logitrack.backend.dto.ReferencePreview;
import com.logitrack.backend.entity.Enquiry;
import com.logitrack.backend.repository.EnquiryRepository;
import com.logitrack.backend.repository.ProductRepository;
import com.logitrack.backend.repository.ContainerTypeRepository;
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

@Service
@RequiredArgsConstructor
@Slf4j
public class EnquiryService {
    
    private final EnquiryRepository enquiryRepository;
    private final ProductRepository productRepository;
    private final ContainerTypeRepository containerTypeRepository;
    private final EnquiryPortService enquiryPortService;  // ✅ 新增：多港口服务
    
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
        if (enquiry.getSalesOfficeId() == null) {
            enquiry.setSalesOfficeId(1);
        }
        if (enquiry.getPolId() == null) {
            enquiry.setPolId(1);  // 默认起运港
        }
        if (enquiry.getPodId() == null) {
            enquiry.setPodId(1);  // 默认目的港
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

        // Persist (cascade persists containerLines) with retry to ensure unique reference
        boolean isIncrease = enquiry.getMonthlySequence() != null && enquiry.getSerialNumber() != null && enquiry.getSerialNumber() > 0;
        int attempts = 0;
        while (true) {
            try {
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
                
                // ✅ 保存 Enquiry 实体
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
            } catch (DataIntegrityViolationException ex) {
                attempts++;
                log.warn("Reference number conflict, retrying... attempt={}", attempts);
                if (attempts >= 3) {
                    throw ex;
                }
            }
        }
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
                    
                    // 然后添加新的 containerLines
                    for (EnquiryContainerLine line : enquiry.getContainerLines()) {
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
