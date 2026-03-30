package com.logitrack.backend.dto;

import com.logitrack.backend.entity.Enquiry;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Offer 创建/更新 DTO
 * 前端发送此结构给后端, 后端负责转化为 Entity 层级关系
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OfferCreateDTO {

    /** Offer 类型 (= Cargo Type): FCL / LCL / AIR / BUYER-CONSOL */
    @NotNull(message = "Offer type is required")
    private Enquiry.OfferType offerType;

    /** 报价日期 */
    private LocalDate offerDate;

    /** Cargo Type 代码 (用于前端展示，后端不存储) */
    private String cargoTypeCode;

    /** 备注 */
    private String remark;

    /** 手动指定 sequenceNo (可选, 后端自动生成) */
    private Integer sequenceNo;

    /** 是否为最新版本 (默认 true) */
    private Boolean isLatest;

    /** 价格明细行 — 已经过前端笛卡尔积展开 */
    @Valid
    private List<OfferPriceLineDTO> priceLines = new ArrayList<>();

    /**
     * 移除所有空行 (所有价格字段都为空或零的行)
     * @return 被过滤掉的行数
     */
    public int filterEmptyLines() {
        if (priceLines == null) return 0;
        int before = priceLines.size();
        priceLines.removeIf(OfferPriceLineDTO::isEmpty);
        return before - priceLines.size();
    }
}
