package com.logitrack.backend.service;

import com.logitrack.backend.dto.OfferContainerDetailDTO;
import com.logitrack.backend.dto.OfferCreateDTO;
import com.logitrack.backend.dto.OfferPriceLineDTO;
import com.logitrack.backend.entity.*;
import com.logitrack.backend.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

/**
 * OfferService 单元测试 v3
 * 测试 Offer → OfferPriceLine → OfferContainerDetail 三级 CRUD
 */
@ExtendWith(MockitoExtension.class)
class OfferServiceTest {

    @Mock private OfferRepository offerRepository;
    @Mock private OfferPriceLineRepository offerPriceLineRepository;
    @Mock private OfferContainerDetailRepository offerContainerDetailRepository;
    @Mock private EnquiryRepository enquiryRepository;
    @Mock private PortRepository portRepository;
    @Mock private EnquiryRouteGroupRepository routeGroupRepository;
    @Mock private EnquiryRouteGroupPolRepository routeGroupPolRepository;
    @Mock private EnquiryRouteGroupPodRepository routeGroupPodRepository;

    @InjectMocks
    private OfferService offerService;

    private Enquiry testEnquiry;

    @BeforeEach
    void setUp() {
        testEnquiry = new Enquiry();
        testEnquiry.setId(1L);
        testEnquiry.setRefNumber("SEA-2603-0001");
        testEnquiry.setProductCode("SEA");
        testEnquiry.setCargoTypeCode("FCL");
        testEnquiry.setStatus(Enquiry.EnquiryStatus.New);
        testEnquiry.setOfferType(Enquiry.OfferType.FCL);
        testEnquiry.setSalesCountryCode("CN");
        testEnquiry.setSalesPicId(1);
        testEnquiry.setSalesOfficeId(1);
        testEnquiry.setEnquiryReceivedDate(LocalDate.of(2026, 3, 20));
        testEnquiry.setCargoReadyDate(LocalDate.of(2026, 4, 15));
    }

    // ========== 创建测试 ==========

    @Test
    void createOfferFromDTO_basicFCL() {
        // Arrange
        OfferCreateDTO dto = new OfferCreateDTO();
        dto.setOfferType(Enquiry.OfferType.FCL);
        dto.setOfferDate(LocalDate.of(2026, 3, 21));
        dto.setRemark("Test FCL offer");
        dto.setPriceLines(new ArrayList<>(List.of(
            createPriceLineDTO(100, 200, null, new BigDecimal("1500.00"))
        )));

        when(enquiryRepository.findById(1L)).thenReturn(Optional.of(testEnquiry));
        when(offerRepository.countByEnquiryId(1L)).thenReturn(0L);
        when(offerRepository.findByEnquiryId(1L)).thenReturn(new ArrayList<>());
        when(offerRepository.save(any(Offer.class))).thenAnswer(inv -> {
            Offer o = inv.getArgument(0);
            o.setId(10L);
            return o;
        });
        when(offerPriceLineRepository.save(any(OfferPriceLine.class))).thenAnswer(inv -> {
            OfferPriceLine l = inv.getArgument(0);
            l.setId(100L);
            return l;
        });

        // Act
        Offer result = offerService.createOfferFromDTO(1L, dto);

        // Assert
        assertNotNull(result);
        assertEquals(10L, result.getId());
        assertEquals(Enquiry.OfferType.FCL, result.getOfferType());
        assertEquals(1, result.getSequenceNo());
        assertTrue(result.getIsLatest());
        assertEquals("Test FCL offer", result.getRemark());

        // Verify enquiry status changed from New → Quoted_Pending
        assertEquals(Enquiry.EnquiryStatus.Quoted_Pending, testEnquiry.getStatus());
        verify(enquiryRepository).save(testEnquiry);
    }

    @Test
    void createOfferFromDTO_filtersEmptyLines() {
        // Arrange: one valid line + one empty line
        OfferPriceLineDTO validLine = createPriceLineDTO(100, 200, new BigDecimal("50.00"), null);
        OfferPriceLineDTO emptyLine = new OfferPriceLineDTO(); // all null/zero
        emptyLine.setPolId(0);
        emptyLine.setPodId(0);

        OfferCreateDTO dto = new OfferCreateDTO();
        dto.setOfferType(Enquiry.OfferType.AIR);
        dto.setPriceLines(new ArrayList<>(List.of(validLine, emptyLine)));

        when(enquiryRepository.findById(1L)).thenReturn(Optional.of(testEnquiry));
        when(offerRepository.countByEnquiryId(1L)).thenReturn(0L);
        when(offerRepository.findByEnquiryId(1L)).thenReturn(new ArrayList<>());
        when(offerRepository.save(any(Offer.class))).thenAnswer(inv -> {
            Offer o = inv.getArgument(0);
            o.setId(20L);
            return o;
        });
        when(offerPriceLineRepository.save(any(OfferPriceLine.class))).thenAnswer(inv -> {
            OfferPriceLine l = inv.getArgument(0);
            l.setId(200L);
            return l;
        });

        // Act
        Offer result = offerService.createOfferFromDTO(1L, dto);

        // Assert: only the valid line should be saved
        assertNotNull(result);
        verify(offerPriceLineRepository, times(1)).save(any(OfferPriceLine.class));
    }

    @Test
    void createOfferFromDTO_withContainerDetails() {
        // Arrange: FCL offer with container details
        OfferContainerDetailDTO containerDTO = new OfferContainerDetailDTO();
        containerDTO.setContainerSizeType("20GP");
        containerDTO.setContainerType("GP");
        containerDTO.setNumberOfContainers(5);
        containerDTO.setCargoWeightPerContainer(new BigDecimal("18000.00"));
        containerDTO.setContainerPrice(new BigDecimal("2500.00"));
        containerDTO.setTeuValue(new BigDecimal("1.0"));

        OfferPriceLineDTO lineDTO = createPriceLineDTO(100, 200, null, null);
        lineDTO.setContainerDetails(new ArrayList<>(List.of(containerDTO)));

        OfferCreateDTO dto = new OfferCreateDTO();
        dto.setOfferType(Enquiry.OfferType.FCL);
        dto.setPriceLines(new ArrayList<>(List.of(lineDTO)));

        when(enquiryRepository.findById(1L)).thenReturn(Optional.of(testEnquiry));
        when(offerRepository.countByEnquiryId(1L)).thenReturn(0L);
        when(offerRepository.findByEnquiryId(1L)).thenReturn(new ArrayList<>());
        when(offerRepository.save(any(Offer.class))).thenAnswer(inv -> {
            Offer o = inv.getArgument(0);
            o.setId(30L);
            return o;
        });
        when(offerPriceLineRepository.save(any(OfferPriceLine.class))).thenAnswer(inv -> {
            OfferPriceLine l = inv.getArgument(0);
            l.setId(300L);
            return l;
        });
        when(offerContainerDetailRepository.save(any(OfferContainerDetail.class))).thenAnswer(inv -> {
            OfferContainerDetail d = inv.getArgument(0);
            d.setId(3000L);
            return d;
        });

        // Act
        Offer result = offerService.createOfferFromDTO(1L, dto);

        // Assert: container detail was saved
        verify(offerContainerDetailRepository, times(1)).save(any(OfferContainerDetail.class));
    }

    @Test
    void createOfferFromDTO_setsLatestAndUnsetsPrevious() {
        // Arrange: existing offer with isLatest=true
        Offer existingOffer = new Offer();
        existingOffer.setId(5L);
        existingOffer.setIsLatest(true);
        existingOffer.setEnquiry(testEnquiry);

        testEnquiry.setStatus(Enquiry.EnquiryStatus.Quoted_Pending); // already quoted

        OfferCreateDTO dto = new OfferCreateDTO();
        dto.setOfferType(Enquiry.OfferType.FCL);
        dto.setPriceLines(new ArrayList<>());

        when(enquiryRepository.findById(1L)).thenReturn(Optional.of(testEnquiry));
        when(offerRepository.countByEnquiryId(1L)).thenReturn(1L);
        when(offerRepository.findByEnquiryId(1L)).thenReturn(new ArrayList<>(List.of(existingOffer)));
        when(offerRepository.saveAll(any())).thenReturn(List.of(existingOffer));
        when(offerRepository.save(any(Offer.class))).thenAnswer(inv -> {
            Offer o = inv.getArgument(0);
            o.setId(6L);
            return o;
        });

        // Act
        Offer result = offerService.createOfferFromDTO(1L, dto);

        // Assert
        assertEquals(6L, result.getId());
        assertEquals(2, result.getSequenceNo()); // auto-increment from 1 existing
        assertTrue(result.getIsLatest());
        assertFalse(existingOffer.getIsLatest()); // previous offer updated

        // Status should NOT change (already Quoted_Pending)
        assertEquals(Enquiry.EnquiryStatus.Quoted_Pending, testEnquiry.getStatus());
    }

    // ========== 更新测试 ==========

    @Test
    void updateOfferFromDTO_replacesAllPriceLines() {
        // Arrange
        Offer existing = new Offer();
        existing.setId(10L);
        existing.setEnquiry(testEnquiry);
        existing.setOfferType(Enquiry.OfferType.FCL);
        existing.setPriceLines(new ArrayList<>());

        OfferCreateDTO dto = new OfferCreateDTO();
        dto.setOfferType(Enquiry.OfferType.LCL); // change type
        dto.setOfferDate(LocalDate.of(2026, 3, 22));
        dto.setRemark("Updated remark");
        dto.setPriceLines(new ArrayList<>(List.of(
            createPriceLineDTO(101, 201, new BigDecimal("30.00"), null),
            createPriceLineDTO(102, 202, new BigDecimal("35.00"), null)
        )));

        when(offerRepository.findById(10L)).thenReturn(Optional.of(existing));
        when(offerRepository.save(any(Offer.class))).thenReturn(existing);
        when(offerPriceLineRepository.save(any(OfferPriceLine.class))).thenAnswer(inv -> {
            OfferPriceLine l = inv.getArgument(0);
            l.setId((long) (Math.random() * 10000));
            return l;
        });

        // Act
        Offer result = offerService.updateOfferFromDTO(10L, dto);

        // Assert
        assertEquals(Enquiry.OfferType.LCL, result.getOfferType());
        assertEquals("Updated remark", result.getRemark());
        verify(offerPriceLineRepository, times(2)).save(any(OfferPriceLine.class));
    }

    // ========== 删除测试 ==========

    @Test
    void deleteOffer_success() {
        when(offerRepository.existsById(10L)).thenReturn(true);
        doNothing().when(offerRepository).deleteById(10L);

        assertDoesNotThrow(() -> offerService.deleteOffer(10L));
        verify(offerRepository).deleteById(10L);
    }

    @Test
    void deleteOffer_notFound() {
        when(offerRepository.existsById(999L)).thenReturn(false);

        RuntimeException ex = assertThrows(RuntimeException.class,
            () -> offerService.deleteOffer(999L));
        assertTrue(ex.getMessage().contains("not found"));
    }

    // ========== 笛卡尔积生成测试 ==========

    @Test
    void autoGeneratePriceLines_normalMode() {
        // Arrange: enquiry with 2 POL × 2 POD, no route groups
        testEnquiry.setPolIds(List.of(100, 101));
        testEnquiry.setPodIds(List.of(200, 201));

        when(routeGroupRepository.findByEnquiryIdOrderByGroupIndex(1L)).thenReturn(new ArrayList<>());
        when(enquiryRepository.findById(1L)).thenReturn(Optional.of(testEnquiry));

        Port pol1 = new Port(); pol1.setId(100); pol1.setPortName("Shanghai");
        Port pol2 = new Port(); pol2.setId(101); pol2.setPortName("Ningbo");
        Port pod1 = new Port(); pod1.setId(200); pod1.setPortName("Rotterdam");
        Port pod2 = new Port(); pod2.setId(201); pod2.setPortName("Hamburg");

        when(portRepository.findById(100)).thenReturn(Optional.of(pol1));
        when(portRepository.findById(101)).thenReturn(Optional.of(pol2));
        when(portRepository.findById(200)).thenReturn(Optional.of(pod1));
        when(portRepository.findById(201)).thenReturn(Optional.of(pod2));

        // Act
        List<OfferPriceLineDTO> lines = offerService.autoGeneratePriceLines(1L);

        // Assert: 2 POL × 2 POD = 4 lines
        assertEquals(4, lines.size());

        // Verify first line
        assertEquals(100, lines.get(0).getPolId());
        assertEquals(200, lines.get(0).getPodId());
        assertEquals("Shanghai", lines.get(0).getPolName());
        assertEquals("Rotterdam", lines.get(0).getPodName());
        assertEquals(0, lines.get(0).getSortOrder());

        // Verify last line
        assertEquals(101, lines.get(3).getPolId());
        assertEquals(201, lines.get(3).getPodId());
        assertEquals("Ningbo", lines.get(3).getPolName());
        assertEquals("Hamburg", lines.get(3).getPodName());
    }

    @Test
    void autoGeneratePriceLines_emptyPorts_returnsEmpty() {
        testEnquiry.setPolIds(new ArrayList<>());
        testEnquiry.setPodIds(new ArrayList<>());

        when(routeGroupRepository.findByEnquiryIdOrderByGroupIndex(1L)).thenReturn(new ArrayList<>());
        when(enquiryRepository.findById(1L)).thenReturn(Optional.of(testEnquiry));

        List<OfferPriceLineDTO> lines = offerService.autoGeneratePriceLines(1L);
        assertTrue(lines.isEmpty());
    }

    // ========== DTO 空行过滤测试 ==========

    @Test
    void offerCreateDTO_filterEmptyLines() {
        OfferCreateDTO dto = new OfferCreateDTO();

        OfferPriceLineDTO valid = new OfferPriceLineDTO();
        valid.setPolId(100);
        valid.setPodId(200);
        valid.setPrice(new BigDecimal("500.00"));

        OfferPriceLineDTO empty = new OfferPriceLineDTO();
        // all fields null/zero = isEmpty() returns true

        dto.setPriceLines(new ArrayList<>(List.of(valid, empty)));

        int removed = dto.filterEmptyLines();
        assertEquals(1, removed);
        assertEquals(1, dto.getPriceLines().size());
        assertEquals(100, dto.getPriceLines().get(0).getPolId());
    }

    // ========== 辅助方法 ==========

    private OfferPriceLineDTO createPriceLineDTO(int polId, int podId, BigDecimal perCbm, BigDecimal price) {
        OfferPriceLineDTO dto = new OfferPriceLineDTO();
        dto.setPolId(polId);
        dto.setPodId(podId);
        dto.setPerCbm(perCbm);
        dto.setPrice(price);
        dto.setSortOrder(0);
        dto.setContainerDetails(new ArrayList<>());
        return dto;
    }
}
