package com.logitrack.backend.service;

import com.logitrack.backend.entity.EnquiryRecord;
import com.logitrack.backend.repository.EnquiryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
    public List<EnquiryRecord> getAllEnquiries() {
        log.debug("Fetching all enquiry records");
        return enquiryRepository.findAll();
    }
    
    /**
     * Get enquiry by ID
     */
    public Optional<EnquiryRecord> getEnquiryById(String id) {
        log.debug("Fetching enquiry with id: {}", id);
        return enquiryRepository.findById(id);
    }
    
    /**
     * Get enquiry by reference number
     */
    public Optional<EnquiryRecord> getEnquiryByReferenceNumber(String referenceNumber) {
        log.debug("Fetching enquiry with reference number: {}", referenceNumber);
        return enquiryRepository.findByReferenceNumber(referenceNumber);
    }
    
    /**
     * Create new enquiry record
     */
    @Transactional
    public EnquiryRecord createEnquiry(EnquiryRecord enquiryRecord) {
        log.info("Creating new enquiry record: {}", enquiryRecord.getReferenceNumber());
        enquiryRecord.setId(null); // Ensure new ID is generated
        return enquiryRepository.save(enquiryRecord);
    }
    
    /**
     * Update existing enquiry record
     */
    @Transactional
    public EnquiryRecord updateEnquiry(String id, EnquiryRecord enquiryRecord) {
        log.info("Updating enquiry record with id: {}", id);
        
        return enquiryRepository.findById(id)
            .map(existing -> {
                enquiryRecord.setId(id); // Preserve the ID
                return enquiryRepository.save(enquiryRecord);
            })
            .orElseThrow(() -> new RuntimeException("Enquiry record not found with id: " + id));
    }
    
    /**
     * Delete enquiry record
     */
    @Transactional
    public void deleteEnquiry(String id) {
        log.info("Deleting enquiry record with id: {}", id);
        
        if (!enquiryRepository.existsById(id)) {
            throw new RuntimeException("Enquiry record not found with id: " + id);
        }
        
        enquiryRepository.deleteById(id);
    }
    
    /**
     * Get enquiries by status
     */
    public List<EnquiryRecord> getEnquiriesByStatus(String status) {
        log.debug("Fetching enquiries with status: {}", status);
        return enquiryRepository.findByStatus(status);
    }
    
    /**
     * Get enquiries by booking confirmation status
     */
    public List<EnquiryRecord> getEnquiriesByBookingStatus(String bookingStatus) {
        log.debug("Fetching enquiries with booking status: {}", bookingStatus);
        return enquiryRepository.findByBookingConfirmed(bookingStatus);
    }
}
