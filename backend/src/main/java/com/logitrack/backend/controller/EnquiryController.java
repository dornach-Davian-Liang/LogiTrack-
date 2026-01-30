package com.logitrack.backend.controller;

import com.logitrack.backend.entity.Enquiry;
import com.logitrack.backend.service.EnquiryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/enquiries")
@RequiredArgsConstructor
@Slf4j

public class EnquiryController {
    
    private final EnquiryService enquiryService;
    
    /**
     * GET /api/enquiries - Get all enquiry records with pagination
     */
    @GetMapping
    public ResponseEntity<?> getAllEnquiries(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String sortOrder) {
        
        log.info("GET /api/enquiries - page={}, size={}, keyword={}", page, size, keyword);
        
        Sort sort = sortOrder.equalsIgnoreCase("asc") 
            ? Sort.by(sortBy).ascending() 
            : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        Page<Enquiry> enquiryPage;
        if (keyword != null && !keyword.trim().isEmpty()) {
            enquiryPage = enquiryService.searchEnquiries(keyword.trim(), pageable);
        } else {
            enquiryPage = enquiryService.getEnquiries(pageable);
        }
        
        // Return in the format expected by frontend
        Map<String, Object> response = new HashMap<>();
        response.put("content", enquiryPage.getContent());
        response.put("totalElements", enquiryPage.getTotalElements());
        response.put("totalPages", enquiryPage.getTotalPages());
        response.put("size", enquiryPage.getSize());
        response.put("number", enquiryPage.getNumber());
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * GET /api/enquiries/all - Get all enquiry records without pagination
     */
    @GetMapping("/all")
    public ResponseEntity<List<Enquiry>> getAllEnquiriesNoPaging() {
        log.info("GET /api/enquiries/all - Fetching all enquiries");
        List<Enquiry> enquiries = enquiryService.getAllEnquiries();
        return ResponseEntity.ok(enquiries);
    }
    
    /**
     * GET /api/enquiries/{id} - Get enquiry by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<Enquiry> getEnquiryById(@PathVariable Long id) {
        log.info("GET /api/enquiries/{} - Fetching enquiry", id);
        return enquiryService.getEnquiryById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * POST /api/enquiries - Create new enquiry record
     */
    @PostMapping
    public ResponseEntity<Enquiry> createEnquiry(@RequestBody Enquiry enquiry) {
        log.info("POST /api/enquiries - Creating new enquiry: {}", enquiry.getReferenceNumber());
        try {
            Enquiry created = enquiryService.createEnquiry(enquiry);
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
    public ResponseEntity<Enquiry> updateEnquiry(
            @PathVariable Long id, 
            @RequestBody Enquiry enquiry) {
        log.info("PUT /api/enquiries/{} - Updating enquiry", id);
        try {
            Enquiry updated = enquiryService.updateEnquiry(id, enquiry);
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
    public ResponseEntity<Void> deleteEnquiry(@PathVariable Long id) {
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
    public ResponseEntity<List<Enquiry>> getEnquiriesByStatus(@PathVariable String status) {
        log.info("GET /api/enquiries/status/{} - Fetching enquiries by status", status);
        try {
            Enquiry.EnquiryStatus enquiryStatus = Enquiry.EnquiryStatus.valueOf(status.toUpperCase());
            List<Enquiry> enquiries = enquiryService.getEnquiriesByStatus(enquiryStatus);
            return ResponseEntity.ok(enquiries);
        } catch (IllegalArgumentException e) {
            log.error("Invalid status: {}", status);
            return ResponseEntity.badRequest().build();
        }
    }
}
