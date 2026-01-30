package com.logitrack.backend.service;

import com.logitrack.backend.entity.Enquiry;
import com.logitrack.backend.repository.EnquiryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
        log.info("Creating new enquiry record: {}", enquiry.getReferenceNumber());
        enquiry.setId(null); // Ensure new ID is generated
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
                enquiry.setId(id); // Preserve the ID
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
