package com.logitrack.backend.controller;

import com.logitrack.backend.entity.EnquiryRecord;
import com.logitrack.backend.service.EnquiryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/enquiries")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"}) // Allow frontend origins
public class EnquiryController {
    
    private final EnquiryService enquiryService;
    
    /**
     * GET /api/enquiries - Get all enquiry records
     */
    @GetMapping
    public ResponseEntity<List<EnquiryRecord>> getAllEnquiries() {
        log.info("GET /api/enquiries - Fetching all enquiries");
        List<EnquiryRecord> enquiries = enquiryService.getAllEnquiries();
        return ResponseEntity.ok(enquiries);
    }
    
    /**
     * GET /api/enquiries/{id} - Get enquiry by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<EnquiryRecord> getEnquiryById(@PathVariable String id) {
        log.info("GET /api/enquiries/{} - Fetching enquiry", id);
        return enquiryService.getEnquiryById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * POST /api/enquiries - Create new enquiry record
     */
    @PostMapping
    public ResponseEntity<EnquiryRecord> createEnquiry(@RequestBody EnquiryRecord enquiryRecord) {
        log.info("POST /api/enquiries - Creating new enquiry: {}", enquiryRecord.getReferenceNumber());
        try {
            EnquiryRecord created = enquiryService.createEnquiry(enquiryRecord);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (Exception e) {
            log.error("Error creating enquiry: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * PUT /api/enquiries/{id} - Update existing enquiry record
     */
    @PutMapping("/{id}")
    public ResponseEntity<EnquiryRecord> updateEnquiry(
            @PathVariable String id, 
            @RequestBody EnquiryRecord enquiryRecord) {
        log.info("PUT /api/enquiries/{} - Updating enquiry", id);
        try {
            EnquiryRecord updated = enquiryService.updateEnquiry(id, enquiryRecord);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            log.error("Error updating enquiry: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * DELETE /api/enquiries/{id} - Delete enquiry record
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEnquiry(@PathVariable String id) {
        log.info("DELETE /api/enquiries/{} - Deleting enquiry", id);
        try {
            enquiryService.deleteEnquiry(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            log.error("Error deleting enquiry: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * GET /api/enquiries/status/{status} - Get enquiries by status
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<List<EnquiryRecord>> getEnquiriesByStatus(@PathVariable String status) {
        log.info("GET /api/enquiries/status/{} - Fetching enquiries by status", status);
        List<EnquiryRecord> enquiries = enquiryService.getEnquiriesByStatus(status);
        return ResponseEntity.ok(enquiries);
    }
    
    /**
     * GET /api/enquiries/booking/{bookingStatus} - Get enquiries by booking status
     */
    @GetMapping("/booking/{bookingStatus}")
    public ResponseEntity<List<EnquiryRecord>> getEnquiriesByBookingStatus(@PathVariable String bookingStatus) {
        log.info("GET /api/enquiries/booking/{} - Fetching enquiries by booking status", bookingStatus);
        List<EnquiryRecord> enquiries = enquiryService.getEnquiriesByBookingStatus(bookingStatus);
        return ResponseEntity.ok(enquiries);
    }
}
