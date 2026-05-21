package com.logitrack.backend.controller;

import com.logitrack.backend.aspect.AuditLogAspect.Audit;
import com.logitrack.backend.dto.ReferencePreview;
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

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 询价?�制??v3
 */
@RestController
@RequestMapping("/api/enquiries")
@RequiredArgsConstructor
@Slf4j
public class EnquiryController {
    
    private final EnquiryService enquiryService;
    
    /**
     * GET /api/enquiries — 询价列表（带筛选）
     */
    @GetMapping
    public ResponseEntity<?> getAllEnquiries(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String productCode,
            @RequestParam(required = false) String cargoTypeCode,
            @RequestParam(required = false) String salesCountryCode,
            @RequestParam(required = false) String assignedCnOffice,
            @RequestParam(required = false) String coreNonCore,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo,
            @RequestParam(required = false) String createdDateFrom,
            @RequestParam(required = false) String createdDateTo,
            @RequestParam(required = false) Integer polPortId,
            @RequestParam(required = false) Integer podPortId,
            @RequestParam(required = false) String createdBy,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(required = false) String sortOrder,
            @RequestParam(required = false) String sortDir) {
        
        // Support both sortOrder and sortDir param names
        String direction = sortOrder != null ? sortOrder : (sortDir != null ? sortDir : "desc");
        
        log.info("GET /api/enquiries - page={}, size={}, keyword={}, status={}, product={}, cargo={}", 
                page, size, keyword, status, productCode, cargoTypeCode);
        
        Sort sort = direction.equalsIgnoreCase("asc") 
            ? Sort.by(sortBy).ascending() 
            : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        // Check if any filter is active
        boolean hasFilters = (keyword != null && !keyword.isBlank()) ||
                status != null || productCode != null || cargoTypeCode != null ||
                salesCountryCode != null || assignedCnOffice != null ||
                coreNonCore != null || dateFrom != null || dateTo != null ||
                createdDateFrom != null || createdDateTo != null ||
                polPortId != null || podPortId != null ||
                createdBy != null;
        
        Page<Enquiry> enquiryPage;
        if (hasFilters) {
            enquiryPage = enquiryService.getEnquiriesFiltered(
                    keyword != null ? keyword.trim() : null,
                    status, productCode, cargoTypeCode,
                    salesCountryCode, assignedCnOffice, coreNonCore,
                    dateFrom, dateTo, polPortId, podPortId,
                    createdDateFrom, createdDateTo,
                    createdBy, pageable);
        } else {
            enquiryPage = enquiryService.getEnquiries(pageable);
        }
        
        Map<String, Object> response = new HashMap<>();
        response.put("content", enquiryPage.getContent());
        response.put("totalElements", enquiryPage.getTotalElements());
        response.put("totalPages", enquiryPage.getTotalPages());
        response.put("size", enquiryPage.getSize());
        response.put("number", enquiryPage.getNumber());
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * GET /api/enquiries/all
     */
    @GetMapping("/all")
    public ResponseEntity<List<Enquiry>> getAllEnquiriesNoPaging() {
        return ResponseEntity.ok(enquiryService.getAllEnquiries());
    }

    /**
     * GET /api/enquiries/export-xlsx — 导出询价为 Excel（含 Lost/Cancelled Reason 下拉验证）
     */
    @GetMapping("/export-xlsx")
    public ResponseEntity<byte[]> exportXlsx(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String cargoTypeCode,
            @RequestParam(required = false) String salesCountryCode,
            @RequestParam(required = false) String assignedCnOffice,
            @RequestParam(required = false) String coreNonCore,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo,
            @RequestParam(required = false) Integer polPortId,
            @RequestParam(required = false) Integer podPortId,
            @RequestParam(required = false) String createdDateFrom,
            @RequestParam(required = false) String createdDateTo) {
        try {
            byte[] data = enquiryService.exportToExcel(
                    keyword, status, cargoTypeCode,
                    salesCountryCode, assignedCnOffice, coreNonCore,
                    dateFrom, dateTo, polPortId, podPortId,
                    createdDateFrom, createdDateTo);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            headers.setContentDispositionFormData("attachment",
                    "Enquiries_Export_" + LocalDate.now() + ".xlsx");
            return new ResponseEntity<>(data, headers, HttpStatus.OK);
        } catch (IOException e) {
            log.error("Export Excel failed", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * GET /api/enquiries/{id} ??询价详�?
     */
    @GetMapping("/{id}")
    public ResponseEntity<Enquiry> getEnquiryById(@PathVariable Long id) {
        return enquiryService.getEnquiryById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    /**
     * GET /api/enquiries/reference/next ??预�?下�?个�??��???     */
    @GetMapping("/reference/next")
    public ResponseEntity<ReferencePreview> getNextReference(
            @RequestParam(required = false) String issueDate,
            @RequestParam(required = false) String productCode) {
        LocalDate date = issueDate == null || issueDate.isBlank()
                ? LocalDate.now()
                : LocalDate.parse(issueDate);
        return ResponseEntity.ok(enquiryService.getNextReference(date, productCode));
    }

    /**
     * GET /api/enquiries/{id}/reference/increase
     */
    @GetMapping("/{id}/reference/increase")
    public ResponseEntity<ReferencePreview> getIncreaseReference(@PathVariable Long id) {
        return ResponseEntity.ok(enquiryService.getNextIncreaseReference(id));
    }
    
    /**
     * POST /api/enquiries ???�建询价
     */
    @PostMapping
    @Audit(action = "CREATE", resourceType = "ENQUIRY")
    public ResponseEntity<?> createEnquiry(@RequestBody Enquiry enquiry, HttpServletRequest request) {
        log.info("POST /api/enquiries");
        String username = request.getHeader("X-Username");
        if (username == null || username.isBlank()) username = "system";
        enquiry.setCreatedBy(username);
        enquiry.setUpdatedBy(username);
        try {
            Enquiry created = enquiryService.createEnquiry(enquiry);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (DataIntegrityViolationException e) {
            // 悲观锁已阻止大多数竞争，此处作为最后防线：返回 409 而非 500
            log.warn("Duplicate key on createEnquiry (concurrent request?): {}", e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("error", "Duplicate reference number - please retry");
            error.put("type", "DUPLICATE_REF");
            return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
        } catch (Exception e) {
            log.error("Error creating enquiry: {}", e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            error.put("type", e.getClass().getSimpleName());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    /**
     * PUT /api/enquiries/{id} ???�新询价
     */
    @Audit(action = "UPDATE", resourceType = "ENQUIRY", resourceIdParam = "id")
    @PutMapping("/{id}")
    public ResponseEntity<?> updateEnquiry(
            @PathVariable Long id, 
            @RequestBody Enquiry enquiry,
            HttpServletRequest request) {
        log.info("PUT /api/enquiries/{}", id);
        String username = request.getHeader("X-Username");
        if (username == null || username.isBlank()) username = "system";
        enquiry.setUpdatedBy(username);
        try {
            Enquiry updated = enquiryService.updateEnquiry(id, enquiry);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            log.error("Error updating enquiry: {}", e.getMessage(), e);
            if (e.getMessage() != null && e.getMessage().contains("not found")) {
                return ResponseEntity.notFound().build();
            }
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    /**
     * PATCH /api/enquiries/{id}/status ???�更?�态�??��??��?
     */
    @Audit(action = "STATUS_CHANGE", resourceType = "ENQUIRY", resourceIdParam = "id")
    @PatchMapping("/{id}/status")
    public ResponseEntity<?> changeStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        log.info("PATCH /api/enquiries/{}/status", id);
        try {
            String newStatus = body.get("status");
            String reason = body.get("reason");
            String reasonText = body.get("reasonText");
            
            if (newStatus == null || newStatus.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "status is required"));
            }
            
            Enquiry updated = enquiryService.changeStatus(id, newStatus, reason, reasonText);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            log.error("Error changing status: {}", e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }
    
    /**
     * DELETE /api/enquiries/{id}
     */
    @Audit(action = "DELETE", resourceType = "ENQUIRY", resourceIdParam = "id")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEnquiry(@PathVariable Long id) {
        log.info("DELETE /api/enquiries/{}", id);
        try {
            enquiryService.deleteEnquiry(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
    
