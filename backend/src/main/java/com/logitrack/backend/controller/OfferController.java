package com.logitrack.backend.controller;

import com.logitrack.backend.dto.OfferCreateDTO;
import com.logitrack.backend.dto.OfferPriceLineDTO;
import com.logitrack.backend.entity.Offer;
import com.logitrack.backend.service.OfferService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 报价控制器 v3.1
 * 支持 DTO 创建/更新 + 笛卡尔积价格行生成
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Slf4j
public class OfferController {

    private final OfferService offerService;

    // ========== 查询 ==========

    @GetMapping("/enquiries/{enquiryId}/offers")
    public ResponseEntity<List<Offer>> getOffersByEnquiry(@PathVariable Long enquiryId) {
        log.info("GET /api/enquiries/{}/offers", enquiryId);
        return ResponseEntity.ok(offerService.getOffersByEnquiryId(enquiryId));
    }

    @GetMapping("/offers/{offerId}")
    public ResponseEntity<?> getOfferById(@PathVariable Long offerId) {
        log.info("GET /api/offers/{}", offerId);
        try {
            return ResponseEntity.ok(offerService.getOfferById(offerId));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // ========== 创建 (DTO, 推荐) ==========

    /**
     * POST /api/enquiries/{enquiryId}/offers — 创建报价 (DTO 版本)
     * 自动空行过滤 + 三级保存
     */
    @PostMapping("/enquiries/{enquiryId}/offers")
    public ResponseEntity<?> createOffer(
            @PathVariable Long enquiryId,
            @Valid @RequestBody OfferCreateDTO dto) {
        log.info("POST /api/enquiries/{}/offers (DTO)", enquiryId);
        try {
            Offer created = offerService.createOfferFromDTO(enquiryId, dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (RuntimeException e) {
            log.error("Error creating offer: {}", e.getMessage(), e);
            return error(e.getMessage());
        }
    }

    // ========== 更新 (DTO, 推荐) ==========

    /**
     * PUT /api/offers/{offerId} — 更新报价 (DTO 版本)
     * 全量替换 priceLines + containerDetails
     */
    @PutMapping("/offers/{offerId}")
    public ResponseEntity<?> updateOffer(
            @PathVariable Long offerId,
            @Valid @RequestBody OfferCreateDTO dto) {
        log.info("PUT /api/offers/{} (DTO)", offerId);
        try {
            Offer updated = offerService.updateOfferFromDTO(offerId, dto);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            log.error("Error updating offer: {}", e.getMessage(), e);
            return error(e.getMessage());
        }
    }

    // ========== 删除 ==========

    @DeleteMapping("/offers/{offerId}")
    public ResponseEntity<?> deleteOffer(@PathVariable Long offerId) {
        log.info("DELETE /api/offers/{}", offerId);
        try {
            offerService.deleteOffer(offerId);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // ========== 笛卡尔积生成 ==========

    /**
     * POST /api/enquiries/{enquiryId}/generate-price-lines
     * 根据询价的 POL×POD 自动生成价格行模板
     * 混合模式: 按 RouteGroup 分组生成
     */
    @PostMapping("/enquiries/{enquiryId}/generate-price-lines")
    public ResponseEntity<?> generatePriceLines(@PathVariable Long enquiryId) {
        log.info("POST /api/enquiries/{}/generate-price-lines", enquiryId);
        try {
            List<OfferPriceLineDTO> lines = offerService.autoGeneratePriceLines(enquiryId);
            return ResponseEntity.ok(lines);
        } catch (RuntimeException e) {
            log.error("Error generating price lines: {}", e.getMessage(), e);
            return error(e.getMessage());
        }
    }

    // ========== 工具方法 ==========

    private ResponseEntity<Map<String, String>> error(String message) {
        Map<String, String> err = new HashMap<>();
        err.put("error", message);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(err);
    }
}
