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

@ExtendWith(MockitoExtension.class)
class StatisticsServiceTest {

    @Mock
    private EnquiryRepository enquiryRepository;

    @InjectMocks
    private StatisticsService statisticsService;

    @Test
    void cnOfficeStatsCountsAllBookingStatuses() {
        LocalDate startDate = LocalDate.of(2026, 1, 1);
        LocalDate endDate = LocalDate.of(2026, 2, 25);

        List<Enquiry> allEnquiries = new ArrayList<>();
        allEnquiries.addAll(createEnquiries("SHANGHAI", Enquiry.BookingConfirmed.Yes, 3, LocalDate.of(2026, 2, 1)));
        allEnquiries.addAll(createEnquiries("SHANGHAI", Enquiry.BookingConfirmed.Pending, 10, LocalDate.of(2026, 2, 3)));
        allEnquiries.addAll(createEnquiries("SHANGHAI", Enquiry.BookingConfirmed.Rejected, 2, LocalDate.of(2026, 1, 15)));
        allEnquiries.addAll(createEnquiries("SHANGHAI", Enquiry.BookingConfirmed.Invalid, 1, LocalDate.of(2026, 1, 20)));
        allEnquiries.addAll(createEnquiries("SHENZHEN", Enquiry.BookingConfirmed.Yes, 2, LocalDate.of(2026, 2, 5)));
        allEnquiries.addAll(createEnquiries("SHANGHAI", Enquiry.BookingConfirmed.Yes, 1, LocalDate.of(2025, 12, 31)));

        when(enquiryRepository.findByEnquiryReceivedDateBetween(any(LocalDate.class), any(LocalDate.class)))
            .thenAnswer(invocation -> {
                LocalDate rangeStart = invocation.getArgument(0);
                LocalDate rangeEnd = invocation.getArgument(1);
                return allEnquiries.stream()
                    .filter(enquiry -> !enquiry.getEnquiryReceivedDate().isBefore(rangeStart)
                        && !enquiry.getEnquiryReceivedDate().isAfter(rangeEnd))
                    .collect(Collectors.toList());
            });

        DashboardFilterDTO filter = DashboardFilterDTO.builder()
            .startDate(startDate)
            .endDate(endDate)
            .build();

        DashboardStatsDTO stats = statisticsService.getDashboardStatsWithFilter(filter);
        assertNotNull(stats);
        assertNotNull(stats.getCnOfficeStats());

        Optional<CNOfficeStatDTO> shanghaiStats = stats.getCnOfficeStats().stream()
            .filter(item -> "SHANGHAI".equals(item.getOfficeName()))
            .findFirst();

        assertTrue(shanghaiStats.isPresent());
        CNOfficeStatDTO office = shanghaiStats.get();
        assertEquals(16, office.getTotalEnquiries());
        assertEquals(3, office.getYes());
        assertEquals(2, office.getRejected());
        assertEquals(1, office.getInvalid());
        assertEquals(10, office.getPending());
        assertEquals(3, office.getConfirmed());
        assertEquals("18.8%", office.getConversionRate());
        assertEquals(16, office.getYes() + office.getRejected() + office.getInvalid() + office.getPending());
    }

    private List<Enquiry> createEnquiries(
        String office,
        Enquiry.BookingConfirmed bookingConfirmed,
        int count,
        LocalDate baseDate
    ) {
        List<Enquiry> enquiries = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            Enquiry enquiry = new Enquiry();
            enquiry.setAssignedCnOfficeCode(office);
            enquiry.setEnquiryReceivedDate(baseDate.plusDays(i % 3));
            enquiry.setStatus(Enquiry.EnquiryStatus.Quoted);
            enquiry.setBookingConfirmed(bookingConfirmed);
            enquiries.add(enquiry);
        }
        return enquiries;
    }
}
