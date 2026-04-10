package com.logitrack.backend.service;

import com.logitrack.backend.dto.OfferContainerDetailDTO;
import com.logitrack.backend.dto.OfferCreateDTO;
import com.logitrack.backend.dto.OfferPriceLineDTO;
import com.logitrack.backend.entity.*;
import com.logitrack.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Offer 报价服务 v3.1
 * 管理 Offer → OfferPriceLine → OfferContainerDetail 三级结构
 * 支持 DTO 输入、空行过滤、笛卡尔积 POL×POD 生成
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OfferService {

    private final OfferRepository offerRepository;
    private final OfferPriceLineRepository offerPriceLineRepository;
    private final OfferContainerDetailRepository offerContainerDetailRepository;
    private final EnquiryRepository enquiryRepository;
    private final PortRepository portRepository;
    private final EnquiryRouteGroupRepository routeGroupRepository;
    private final EnquiryRouteGroupPolRepository routeGroupPolRepository;
    private final EnquiryRouteGroupPodRepository routeGroupPodRepository;

    // ========== 查询 ==========

    @Transactional(readOnly = true)
    public List<Offer> getOffersByEnquiryId(Long enquiryId) {
        List<Offer> offers = offerRepository.findByEnquiryId(enquiryId);
        for (Offer offer : offers) {
            loadTransientData(offer);
        }
        return offers;
    }

    @Transactional(readOnly = true)
    public Offer getOfferById(Long offerId) {
        Offer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new RuntimeException("Offer not found: " + offerId));
        loadTransientData(offer);
        return offer;
    }

    // ========== 创建 (DTO) ==========

    /**
     * 从 DTO 创建 Offer
     * 1. 自动过滤空行
     * 2. 自动设置 sequenceNo, 旧 offer isLatest=false
     * 3. DTO → Entity 三级保存
     * 4. 询价 New → Quoted_Pending
     */
    @Transactional
    public Offer createOfferFromDTO(Long enquiryId, OfferCreateDTO dto) {
        int removed = dto.filterEmptyLines();
        if (removed > 0) {
            log.info("Filtered {} empty price lines for enquiry {}", removed, enquiryId);
        }

        Enquiry enquiry = enquiryRepository.findById(enquiryId)
                .orElseThrow(() -> new RuntimeException("Enquiry not found: " + enquiryId));

        Offer offer = new Offer();
        offer.setEnquiry(enquiry);
        offer.setOfferType(dto.getOfferType());
        offer.setOfferDate(dto.getOfferDate());
        offer.setRemark(dto.getRemark());
        offer.setContainerCurrency(dto.getContainerCurrency());
        offer.setLocalChargeCurrency(dto.getLocalChargeCurrency());
        offer.setIsLatest(true);

        if (dto.getSequenceNo() != null) {
            offer.setSequenceNo(dto.getSequenceNo());
        } else {
            long count = offerRepository.countByEnquiryId(enquiryId);
            offer.setSequenceNo((int) count + 1);
        }

        // 旧 offer isLatest=false
        List<Offer> existing = offerRepository.findByEnquiryId(enquiryId);
        for (Offer ex : existing) {
            if (Boolean.TRUE.equals(ex.getIsLatest())) {
                ex.setIsLatest(false);
            }
        }
        offerRepository.saveAll(existing);

        if (offer.getOfferType() == null) {
            offer.setOfferType(enquiry.getOfferType());
        }

        offer.setPriceLines(new ArrayList<>());
        Offer saved = offerRepository.save(offer);

        savePriceLinesFromDTO(saved, dto.getPriceLines());

        // 仅当报价行有实际价格数据时才自动升级状态
        if (enquiry.getStatus() == Enquiry.EnquiryStatus.New && hasPricingInDTO(dto.getPriceLines())) {
            enquiry.setStatus(Enquiry.EnquiryStatus.Quoted_Pending);
            enquiryRepository.save(enquiry);
            log.info("Enquiry {} status: New → Quoted_Pending (pricing detected)", enquiryId);
        }

        loadTransientData(saved);
        return saved;
    }

    // ========== 更新 (DTO) ==========

    @Transactional
    public Offer updateOfferFromDTO(Long offerId, OfferCreateDTO dto) {
        int removed = dto.filterEmptyLines();
        if (removed > 0) {
            log.info("Filtered {} empty price lines for offer update {}", removed, offerId);
        }

        Offer existing = offerRepository.findById(offerId)
                .orElseThrow(() -> new RuntimeException("Offer not found: " + offerId));

        existing.setOfferType(dto.getOfferType());
        existing.setOfferDate(dto.getOfferDate());
        existing.setRemark(dto.getRemark());
        existing.setContainerCurrency(dto.getContainerCurrency());
        existing.setLocalChargeCurrency(dto.getLocalChargeCurrency());
        if (dto.getIsLatest() != null) {
            existing.setIsLatest(dto.getIsLatest());
        }

        existing.getPriceLines().clear();
        offerRepository.save(existing);
        offerRepository.flush();

        savePriceLinesFromDTO(existing, dto.getPriceLines());

        loadTransientData(existing);
        return existing;
    }

    // ========== 旧 Entity 接口兼容 ==========

    @Transactional
    public Offer createOffer(Long enquiryId, Offer offer) {
        Enquiry enquiry = enquiryRepository.findById(enquiryId)
                .orElseThrow(() -> new RuntimeException("Enquiry not found: " + enquiryId));

        offer.setId(null);
        offer.setEnquiry(enquiry);

        if (offer.getSequenceNo() == null) {
            long count = offerRepository.countByEnquiryId(enquiryId);
            offer.setSequenceNo((int) count + 1);
        }

        offer.setIsLatest(true);
        List<Offer> existing = offerRepository.findByEnquiryId(enquiryId);
        for (Offer ex : existing) {
            if (Boolean.TRUE.equals(ex.getIsLatest())) {
                ex.setIsLatest(false);
            }
        }
        offerRepository.saveAll(existing);

        if (offer.getOfferType() == null) {
            offer.setOfferType(enquiry.getOfferType());
        }

        List<OfferPriceLine> incomingLines = offer.getPriceLines() != null
                ? new ArrayList<>(offer.getPriceLines())
                : new ArrayList<>();
        offer.setPriceLines(new ArrayList<>());
        Offer saved = offerRepository.save(offer);

        savePriceLines(saved, incomingLines);

        // 仅当报价行有实际价格数据时才自动升级状态
        if (enquiry.getStatus() == Enquiry.EnquiryStatus.New && hasPricingInLines(incomingLines)) {
            enquiry.setStatus(Enquiry.EnquiryStatus.Quoted_Pending);
            enquiryRepository.save(enquiry);
            log.info("Enquiry {} status: New → Quoted_Pending (pricing detected)", enquiry.getId());
        }

        loadTransientData(saved);
        return saved;
    }

    @Transactional
    public Offer updateOffer(Long offerId, Offer incoming) {
        Offer existing = offerRepository.findById(offerId)
                .orElseThrow(() -> new RuntimeException("Offer not found: " + offerId));

        existing.setOfferType(incoming.getOfferType());
        existing.setOfferDate(incoming.getOfferDate());
        existing.setRemark(incoming.getRemark());

        if (incoming.getIsLatest() != null) {
            existing.setIsLatest(incoming.getIsLatest());
        }

        existing.getPriceLines().clear();
        offerRepository.save(existing);
        offerRepository.flush();

        List<OfferPriceLine> incomingLines = incoming.getPriceLines() != null
                ? new ArrayList<>(incoming.getPriceLines())
                : new ArrayList<>();
        savePriceLines(existing, incomingLines);

        loadTransientData(existing);
        return existing;
    }

    // ========== 删除 ==========

    @Transactional
    public void deleteOffer(Long offerId) {
        if (!offerRepository.existsById(offerId)) {
            throw new RuntimeException("Offer not found: " + offerId);
        }
        offerRepository.deleteById(offerId);
    }

    // ========== 笛卡尔积生成 ==========

    /**
     * 自动判断模式并生成 POL×POD price line 模板 (用于前端初始化)
     */
    @Transactional(readOnly = true)
    public List<OfferPriceLineDTO> autoGeneratePriceLines(Long enquiryId) {
        List<EnquiryRouteGroup> groups = routeGroupRepository.findByEnquiryIdOrderByGroupIndex(enquiryId);
        if (groups.isEmpty()) {
            return generatePriceLines(enquiryId);
        } else {
            return generatePriceLinesFromRouteGroups(enquiryId, groups);
        }
    }

    /**
     * 普通模式: 询价的 POL × POD 笛卡尔积
     */
    private List<OfferPriceLineDTO> generatePriceLines(Long enquiryId) {
        Enquiry enquiry = enquiryRepository.findById(enquiryId)
                .orElseThrow(() -> new RuntimeException("Enquiry not found: " + enquiryId));

        List<Integer> polIds = enquiry.getPolIds();
        List<Integer> podIds = enquiry.getPodIds();

        if (polIds == null || polIds.isEmpty() || podIds == null || podIds.isEmpty()) {
            log.warn("Enquiry {} has no POL/POD, returning empty", enquiryId);
            return new ArrayList<>();
        }

        List<OfferPriceLineDTO> result = new ArrayList<>();
        int sortOrder = 0;

        for (Integer polId : polIds) {
            for (Integer podId : podIds) {
                OfferPriceLineDTO line = new OfferPriceLineDTO();
                line.setPolId(polId);
                line.setPodId(podId);
                line.setSortOrder(sortOrder++);
                portRepository.findById(polId).ifPresent(p -> line.setPolName(p.getPortName()));
                portRepository.findById(podId).ifPresent(p -> line.setPodName(p.getPortName()));
                result.add(line);
            }
        }

        log.info("Generated {} price lines for enquiry {} ({} POL × {} POD)",
                result.size(), enquiryId, polIds.size(), podIds.size());
        return result;
    }

    /**
     * 混合模式: 按 RouteGroup 分别生成 POL × POD 笛卡尔积
     */
    private List<OfferPriceLineDTO> generatePriceLinesFromRouteGroups(
            Long enquiryId, List<EnquiryRouteGroup> groups) {

        List<OfferPriceLineDTO> result = new ArrayList<>();
        int sortOrder = 0;

        for (EnquiryRouteGroup group : groups) {
            List<Integer> polIds = routeGroupPolRepository.findByRouteGroupId(group.getId())
                    .stream().map(EnquiryRouteGroupPol::getPortId).collect(Collectors.toList());
            List<Integer> podIds = routeGroupPodRepository.findByRouteGroupId(group.getId())
                    .stream().map(EnquiryRouteGroupPod::getPortId).collect(Collectors.toList());

            if (polIds.isEmpty() || podIds.isEmpty()) continue;

            for (Integer polId : polIds) {
                for (Integer podId : podIds) {
                    OfferPriceLineDTO line = new OfferPriceLineDTO();
                    line.setRouteGroupId(group.getId());
                    line.setSubMode(group.getSubMode());
                    line.setPolId(polId);
                    line.setPodId(podId);
                    line.setSortOrder(sortOrder++);
                    portRepository.findById(polId).ifPresent(p -> line.setPolName(p.getPortName()));
                    portRepository.findById(podId).ifPresent(p -> line.setPodName(p.getPortName()));
                    result.add(line);
                }
            }
        }

        log.info("Generated {} price lines from {} route groups for enquiry {}",
                result.size(), groups.size(), enquiryId);
        return result;
    }

    // ========== 内部方法 ==========

    private void savePriceLinesFromDTO(Offer offer, List<OfferPriceLineDTO> lineDtos) {
        if (lineDtos == null) return;
        int sortOrder = 0;
        for (OfferPriceLineDTO dto : lineDtos) {
            OfferPriceLine line = new OfferPriceLine();
            line.setOffer(offer);
            line.setRouteGroupId(dto.getRouteGroupId());
            line.setSubMode(dto.getSubMode());
            line.setPolId(dto.getPolId());
            line.setPodId(dto.getPodId());
            line.setPerCbm(dto.getPerCbm());
            line.setMinCharge(dto.getMinCharge());
            line.setLocalCharge(dto.getLocalCharge());
            line.setPrice(dto.getPrice());
            line.setPriceText(dto.getPriceText());
            line.setCarrier(dto.getCarrier());
            line.setSortOrder(dto.getSortOrder() != null ? dto.getSortOrder() : sortOrder);
            sortOrder++;

            line.setContainerDetails(new ArrayList<>());
            OfferPriceLine savedLine = offerPriceLineRepository.save(line);

            if (dto.getContainerDetails() != null) {
                for (OfferContainerDetailDTO detailDto : dto.getContainerDetails()) {
                    OfferContainerDetail detail = new OfferContainerDetail();
                    detail.setPriceLine(savedLine);
                    detail.setContainerSizeType(detailDto.getContainerSizeType());
                    detail.setContainerType(detailDto.getContainerType());
                    detail.setNumberOfContainers(detailDto.getNumberOfContainers() != null
                            ? detailDto.getNumberOfContainers() : 0);
                    detail.setCargoWeightPerContainer(detailDto.getCargoWeightPerContainer());
                    detail.setContainerPrice(detailDto.getContainerPrice());
                    detail.setTeuValue(detailDto.getTeuValue() != null
                            ? detailDto.getTeuValue() : BigDecimal.ONE);
                    // Compute line_teu = teu_value * number_of_containers
                    detail.setLineTeu(detail.getTeuValue().multiply(
                            BigDecimal.valueOf(detail.getNumberOfContainers())));
                    offerContainerDetailRepository.save(detail);
                }
            }

            offer.getPriceLines().add(savedLine);
        }
    }

    private void savePriceLines(Offer offer, List<OfferPriceLine> lines) {
        int sortOrder = 0;
        for (OfferPriceLine line : lines) {
            line.setId(null);
            line.setOffer(offer);
            line.setSortOrder(sortOrder++);

            List<OfferContainerDetail> incomingDetails = line.getContainerDetails() != null
                    ? new ArrayList<>(line.getContainerDetails())
                    : new ArrayList<>();
            line.setContainerDetails(new ArrayList<>());

            OfferPriceLine savedLine = offerPriceLineRepository.save(line);

            for (OfferContainerDetail detail : incomingDetails) {
                detail.setId(null);
                detail.setPriceLine(savedLine);
                // Compute line_teu if not set
                if (detail.getLineTeu() == null && detail.getTeuValue() != null) {
                    detail.setLineTeu(detail.getTeuValue().multiply(
                            BigDecimal.valueOf(detail.getNumberOfContainers() != null ? detail.getNumberOfContainers() : 0)));
                }
                offerContainerDetailRepository.save(detail);
            }

            offer.getPriceLines().add(savedLine);
        }
    }

    /**
     * 检查 DTO 价格行列表是否包含实际报价数据（非空行）
     */
    private boolean hasPricingInDTO(List<OfferPriceLineDTO> lines) {
        if (lines == null || lines.isEmpty()) return false;
        return lines.stream().anyMatch(line -> !line.isEmpty());
    }

    /**
     * 检查 Entity 价格行列表是否包含实际报价数据
     */
    private boolean hasPricingInLines(List<OfferPriceLine> lines) {
        if (lines == null || lines.isEmpty()) return false;
        return lines.stream().anyMatch(line -> {
            boolean hasPrice = (line.getPrice() != null && line.getPrice().compareTo(BigDecimal.ZERO) > 0)
                    || (line.getPerCbm() != null && line.getPerCbm().compareTo(BigDecimal.ZERO) > 0)
                    || (line.getMinCharge() != null && line.getMinCharge().compareTo(BigDecimal.ZERO) > 0)
                    || (line.getLocalCharge() != null && line.getLocalCharge().compareTo(BigDecimal.ZERO) > 0)
                    || (line.getPriceText() != null && !line.getPriceText().isBlank());
            boolean hasContainerPrice = line.getContainerDetails() != null
                    && line.getContainerDetails().stream().anyMatch(d ->
                        d.getContainerPrice() != null && d.getContainerPrice().compareTo(BigDecimal.ZERO) > 0);
            return hasPrice || hasContainerPrice;
        });
    }

    private void loadTransientData(Offer offer) {
        if (offer.getPriceLines() == null) return;
        for (OfferPriceLine line : offer.getPriceLines()) {
            if (line.getPolId() != null) {
                portRepository.findById(line.getPolId())
                        .ifPresent(p -> line.setPolName(p.getPortName()));
            }
            if (line.getPodId() != null) {
                portRepository.findById(line.getPodId())
                        .ifPresent(p -> line.setPodName(p.getPortName()));
            }
        }
    }
}
