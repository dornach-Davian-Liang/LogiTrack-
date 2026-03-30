package com.logitrack.backend.service;

import com.logitrack.backend.dto.CNOfficeStatDTO;
import com.logitrack.backend.dto.DashboardFilterDTO;
import com.logitrack.backend.dto.DashboardStatsDTO;
import com.logitrack.backend.entity.Enquiry;
import com.logitrack.backend.repository.EnquiryRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/**
 * StatisticsService 单元测试 v3
 * 适配 5 值 EnquiryStatus (New, Quoted_Pending, Secured, Lost, Cancelled)
 * 不再使用已删除的 BookingConfirmed 枚举
 */
@ExtendWith(MockitoExtension.class)
class StatisticsServiceTest {

    @Mock
    private EnquiryRepository enquiryRepository;

    @InjectMocks
    private StatisticsService statisticsService;

    /**
     * 测试 CN Office 统计 — v3 五种状态
     * SHANGHAI: 3 Secured + 10 Quoted_Pending + 2 Lost + 1 Cancelled + 2 New = 18
     * SHENZHEN: 2 Secured
     */
    @Test
    void cnOfficeStatsCountsAllStatuses() {
        LocalDate startDate = LocalDate.of(2026, 1, 1);
        LocalDate endDate = LocalDate.of(2026, 3, 25);

        List<Enquiry> allEnquiries = new ArrayList<>();
        // SHANGHAI office — mixed statuses
        allEnquiries.addAll(createEnquiries("SHANGHAI", Enquiry.EnquiryStatus.Secured, 3, LocalDate.of(2026, 2, 1)));
        allEnquiries.addAll(createEnquiries("SHANGHAI", Enquiry.EnquiryStatus.Quoted_Pending, 10, LocalDate.of(2026, 2, 3)));
        allEnquiries.addAll(createEnquiries("SHANGHAI", Enquiry.EnquiryStatus.Lost, 2, LocalDate.of(2026, 1, 15)));
        allEnquiries.addAll(createEnquiries("SHANGHAI", Enquiry.EnquiryStatus.Cancelled, 1, LocalDate.of(2026, 1, 20)));
        allEnquiries.addAll(createEnquiries("SHANGHAI", Enquiry.EnquiryStatus.New, 2, LocalDate.of(2026, 3, 10)));
        // SHENZHEN office
        allEnquiries.addAll(createEnquiries("SHENZHEN", Enquiry.EnquiryStatus.Secured, 2, LocalDate.of(2026, 2, 5)));
        // Out-of-range entry (should be excluded by date filter)
        allEnquiries.addAll(createEnquiries("SHANGHAI", Enquiry.EnquiryStatus.Secured, 1, LocalDate.of(2025, 12, 31)));

        when(enquiryRepository.findByEnquiryReceivedDateBetween(any(LocalDate.class), any(LocalDate.class)))
            .thenAnswer(invocation -> {
                LocalDate rangeStart = invocation.getArgument(0);
                LocalDate rangeEnd = invocation.getArgument(1);
                return allEnquiries.stream()
                    .filter(e -> !e.getEnquiryReceivedDate().isBefore(rangeStart)
                        && !e.getEnquiryReceivedDate().isAfter(rangeEnd))
                    .collect(Collectors.toList());
            });

        DashboardFilterDTO filter = DashboardFilterDTO.builder()
            .startDate(startDate)
            .endDate(endDate)
            .build();

        DashboardStatsDTO stats = statisticsService.getDashboardStatsWithFilter(filter);
        assertNotNull(stats);
        assertNotNull(stats.getCnOfficeStats());

        // SHANGHAI: 3 Secured + 10 Quoted_Pending + 2 Lost + 1 Cancelled + 2 New = 18
        Optional<CNOfficeStatDTO> shanghaiStats = stats.getCnOfficeStats().stream()
            .filter(item -> "SHANGHAI".equals(item.getOfficeName()))
            .findFirst();

        assertTrue(shanghaiStats.isPresent());
        CNOfficeStatDTO office = shanghaiStats.get();
        assertEquals(18, office.getTotalEnquiries());
        // confirmed = Secured count = 3
        assertEquals(3, office.getConfirmed());
        // quoted = Quoted_Pending count = 10
        assertEquals(10, office.getQuoted());
        // rejected = Lost count = 2
        assertEquals(2, office.getRejected());
        // invalid = Cancelled count = 1
        assertEquals(1, office.getInvalid());
        // Conversion rate = 3/18 * 100 = 16.7%
        assertEquals("16.7%", office.getConversionRate());

        // SHENZHEN: 2 Secured
        Optional<CNOfficeStatDTO> shenzhenStats = stats.getCnOfficeStats().stream()
            .filter(item -> "SHENZHEN".equals(item.getOfficeName()))
            .findFirst();

        assertTrue(shenzhenStats.isPresent());
        assertEquals(2, shenzhenStats.get().getTotalEnquiries());
        assertEquals(2, shenzhenStats.get().getConfirmed());
        assertEquals("100.0%", shenzhenStats.get().getConversionRate());
    }

    /**
     * 辅助方法：创建指定状态的询价列表
     */
    private List<Enquiry> createEnquiries(
        String office,
        Enquiry.EnquiryStatus status,
        int count,
        LocalDate baseDate
    ) {
        List<Enquiry> enquiries = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            Enquiry enquiry = new Enquiry();
            enquiry.setAssignedCnOffice(office);
            enquiry.setEnquiryReceivedDate(baseDate.plusDays(i % 3));
            enquiry.setStatus(status);
            enquiry.setProductCode("SEA");
            enquiry.setCargoTypeCode("FCL");
            enquiry.setSalesCountryCode("CN");
            enquiry.setSalesPicId(1);
            enquiry.setSalesOfficeId(1);
            enquiry.setRefNumber("TEST-" + System.nanoTime());
            enquiries.add(enquiry);
        }
        return enquiries;
    }
}
