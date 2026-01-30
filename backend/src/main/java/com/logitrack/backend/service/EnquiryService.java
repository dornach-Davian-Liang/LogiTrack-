package com.logitrack.backend.service;

import com.logitrack.backend.entity.Enquiry;
import com.logitrack.backend.repository.EnquiryRepository;
import com.logitrack.backend.repository.ProductRepository;
import com.logitrack.backend.repository.ContainerTypeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.logitrack.backend.entity.EnquiryContainerLine;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class EnquiryService {
    
    private final EnquiryRepository enquiryRepository;
    private final ProductRepository productRepository;
    private final ContainerTypeRepository containerTypeRepository;
    
    /**
     * Get all enquiry records
     */
    public List<Enquiry> getAllEnquiries() {
        log.debug("Fetching all enquiry records");
        return enquiryRepository.findAll();
    }
    
    /**
     * Get enquiries with pagination
     */
    public Page<Enquiry> getEnquiries(Pageable pageable) {
        log.debug("Fetching enquiries with pagination");
        return enquiryRepository.findAll(pageable);
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
        return enquiryRepository.findById(id);
    }
    
    /**
     * Get enquiry by reference number
     */
    public Optional<Enquiry> getEnquiryByReferenceNumber(String referenceNumber) {
        log.debug("Fetching enquiry with reference number: {}", referenceNumber);
        return enquiryRepository.findByReferenceNumber(referenceNumber);
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

        // Reference month YYMM
        java.time.format.DateTimeFormatter fm = java.time.format.DateTimeFormatter.ofPattern("yyMM");
        String refMonth = enquiry.getIssueDate().format(fm);
        enquiry.setReferenceMonth(refMonth);

        // monthly sequence (count existing in same month + 1)
        long seq = enquiryRepository.countByReferenceMonth(refMonth) + 1;
        enquiry.setMonthlySequence((int) seq);

        // serial number default
        if (enquiry.getSerialNumber() == null) enquiry.setSerialNumber(0);

        // product abbr lookup
        String abbr = "X";
        if (enquiry.getProductCode() != null) {
            Optional<com.logitrack.backend.entity.Product> prod = productRepository.findById(enquiry.getProductCode());
            if (prod.isPresent()) {
                abbr = prod.get().getAbbr();
            }
        }
        enquiry.setProductAbbr(abbr);

        // build reference number. Use CN prefix by default to keep existing behaviour
        String refNumber = String.format("CN%s%03d-%s%s",
                refMonth,
                seq,
                abbr,
                (enquiry.getSerialNumber() != null && enquiry.getSerialNumber() > 0) ? enquiry.getSerialNumber() : "");
        enquiry.setReferenceNumber(refNumber);

        // Handle container lines and compute TEU aggregate
        java.math.BigDecimal totalTeu = java.math.BigDecimal.ZERO;
        if (enquiry.getContainerLines() != null && !enquiry.getContainerLines().isEmpty()) {
            for (EnquiryContainerLine line : enquiry.getContainerLines()) {
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
                if (line.getContainerTypeId() != null) {
                    Optional<com.logitrack.backend.entity.ContainerType> maybeCt = containerTypeRepository.findById(line.getContainerTypeId());
                    if (maybeCt.isPresent()) {
                        com.logitrack.backend.entity.ContainerType ct = maybeCt.get();
                        java.math.BigDecimal t = ct.getTeuValue() != null ? ct.getTeuValue() : java.math.BigDecimal.ZERO;
                        // compute line TEU = qty * teuValue (not stored on line entity)
                        java.math.BigDecimal lineTeu = t.multiply(java.math.BigDecimal.valueOf(qty));
                        // no direct setter for lineTeu in EnquiryContainerLine; skip explicit set
                    }
                }
                // accumulate total TEU by fetching container type again (safer fast path)
                if (line.getContainerTypeId() != null) {
                    Optional<com.logitrack.backend.entity.ContainerType> maybeCt2 = containerTypeRepository.findById(line.getContainerTypeId());
                    if (maybeCt2.isPresent()) {
                        com.logitrack.backend.entity.ContainerType ct2 = maybeCt2.get();
                        java.math.BigDecimal t2 = ct2.getTeuValue() != null ? ct2.getTeuValue() : java.math.BigDecimal.ZERO;
                        totalTeu = totalTeu.add(t2.multiply(java.math.BigDecimal.valueOf(qty)));
                    }
                }
            }
        }
        enquiry.setQuantityTeu(totalTeu);

        // Persist (cascade persists containerLines)
        return enquiryRepository.save(enquiry);
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

                // Ensure container lines are attached to parent and compute TEU
                java.math.BigDecimal totalTeu = existing.getQuantityTeu() != null ? existing.getQuantityTeu() : java.math.BigDecimal.ZERO;
                totalTeu = java.math.BigDecimal.ZERO;
                if (enquiry.getContainerLines() != null && !enquiry.getContainerLines().isEmpty()) {
                    for (EnquiryContainerLine line : enquiry.getContainerLines()) {
                        line.setEnquiry(enquiry);
                        int qty = line.getContainerQty() != null ? line.getContainerQty() : 0;
                        if (line.getContainerTypeId() != null) {
                            Optional<com.logitrack.backend.entity.ContainerType> maybeCt3 = containerTypeRepository.findById(line.getContainerTypeId());
                            if (maybeCt3.isPresent()) {
                                com.logitrack.backend.entity.ContainerType ct3 = maybeCt3.get();
                                java.math.BigDecimal t3 = ct3.getTeuValue() != null ? ct3.getTeuValue() : java.math.BigDecimal.ZERO;
                                totalTeu = totalTeu.add(t3.multiply(java.math.BigDecimal.valueOf(qty)));
                            }
                        }
                    }
                }
                enquiry.setQuantityTeu(totalTeu);

                return enquiryRepository.save(enquiry);
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
