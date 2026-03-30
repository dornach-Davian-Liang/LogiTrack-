package com.logitrack.backend.dto;

import com.logitrack.backend.entity.EnquiryRouteGroup;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * 报价价格明细行 DTO
 * 对应 offer_price_line 表 — 每行是一个 POL-POD 对
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OfferPriceLineDTO {

    /** 路线组 ID (混合模式时非空) */
    private Long routeGroupId;

    /** 子模式: AIR / SEA / RAIL (混合模式时非空) */
    private EnquiryRouteGroup.SubMode subMode;

    /** 起运港 ID */
    @NotNull(message = "POL ID is required")
    private Integer polId;

    /** 目的港 ID */
    @NotNull(message = "POD ID is required")
    private Integer podId;

    /** 每 CBM 费率 */
    private BigDecimal perCbm;

    /** 最小收费 */
    private BigDecimal minCharge;

    /** 本地费用 */
    private BigDecimal localCharge;

    /** 价格 (AIR/LCL 模式) */
    private BigDecimal price;

    /** 价格备注 */
    private String priceText;

    /** 排序 (前端维护，后端可重算) */
    private Integer sortOrder;

    /** 容器明细列表 (FCL/BUYER-CONSOL 专用) */
    @Valid
    private List<OfferContainerDetailDTO> containerDetails = new ArrayList<>();

    // ---- transient 展示字段，由后端填充 ----
    private String polName;
    private String podName;

    /**
     * 判断是否为"空行" — 所有价格/容器字段都为空或零
     */
    public boolean isEmpty() {
        boolean priceFieldsEmpty = (perCbm == null || perCbm.compareTo(BigDecimal.ZERO) == 0)
                && (minCharge == null || minCharge.compareTo(BigDecimal.ZERO) == 0)
                && (localCharge == null || localCharge.compareTo(BigDecimal.ZERO) == 0)
                && (price == null || price.compareTo(BigDecimal.ZERO) == 0)
                && (priceText == null || priceText.isBlank());

        boolean containerFieldsEmpty = containerDetails == null || containerDetails.isEmpty()
                || containerDetails.stream().allMatch(cd ->
                    (cd.getContainerPrice() == null || cd.getContainerPrice().compareTo(BigDecimal.ZERO) == 0)
                    && (cd.getNumberOfContainers() == null || cd.getNumberOfContainers() == 0));

        return priceFieldsEmpty && containerFieldsEmpty;
    }
}
