package com.logitrack.backend.specification;

import com.logitrack.backend.entity.Enquiry;
import com.logitrack.backend.entity.EnquiryPol;
import com.logitrack.backend.entity.EnquiryPod;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Subquery;
import jakarta.persistence.criteria.Root;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * JPA Specification for dynamic enquiry filtering.
 */
public class EnquirySpecification {

    public static Specification<Enquiry> withFilters(
            String keyword,
            String status,
            String productCode,
            String cargoTypeCode,
            String salesCountryCode,
            String assignedCnOffice,
            String coreNonCore,
            String dateFrom,
            String dateTo,
            Integer polPortId,
            Integer podPortId,
            String createdDateFrom,
            String createdDateTo) {

        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Keyword search (ref number, commodity, salesCountryCode)
            if (keyword != null && !keyword.isBlank()) {
                String kw = "%" + keyword.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                    cb.like(cb.lower(root.get("refNumber")), kw),
                    cb.like(cb.lower(root.get("commodity")), kw),
                    cb.like(cb.lower(root.get("salesCountryCode")), kw)
                ));
            }

            // Status filter — handle both "Quoted & Pending" and "Quoted_Pending"
            if (status != null && !status.isBlank()) {
                try {
                    Enquiry.EnquiryStatus enumStatus = Enquiry.EnquiryStatus.fromString(status);
                    predicates.add(cb.equal(root.get("status"), enumStatus));
                } catch (IllegalArgumentException e) {
                    // Unknown status, ignore
                }
            }

            // Product code filter
            if (productCode != null && !productCode.isBlank()) {
                predicates.add(cb.equal(root.get("productCode"), productCode));
            }

            // Cargo type filter
            if (cargoTypeCode != null && !cargoTypeCode.isBlank()) {
                predicates.add(cb.equal(root.get("cargoTypeCode"), cargoTypeCode));
            }

            // Sales country filter
            if (salesCountryCode != null && !salesCountryCode.isBlank()) {
                predicates.add(cb.equal(root.get("salesCountryCode"), salesCountryCode));
            }

            // CN Office filter — supports comma-separated multiple values
            if (assignedCnOffice != null && !assignedCnOffice.isBlank()) {
                if (assignedCnOffice.contains(",")) {
                    List<String> offices = Arrays.stream(assignedCnOffice.split(","))
                            .map(String::trim).filter(s -> !s.isEmpty()).toList();
                    predicates.add(root.get("assignedCnOffice").in(offices));
                } else {
                    predicates.add(cb.equal(root.get("assignedCnOffice"), assignedCnOffice));
                }
            }

            // Core/Non-Core filter — handle both formats
            if (coreNonCore != null && !coreNonCore.isBlank()) {
                try {
                    Enquiry.CoreNonCore coreEnum = Enquiry.CoreNonCore.fromString(coreNonCore);
                    predicates.add(cb.equal(root.get("coreNonCore"), coreEnum));
                } catch (IllegalArgumentException e) {
                    // Unknown value, ignore
                }
            }

            // Date range filter (enquiryReceivedDate)
            if (dateFrom != null && !dateFrom.isBlank()) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("enquiryReceivedDate"), LocalDate.parse(dateFrom)));
            }
            if (dateTo != null && !dateTo.isBlank()) {
                predicates.add(cb.lessThanOrEqualTo(root.get("enquiryReceivedDate"), LocalDate.parse(dateTo)));
            }

            // Date range filter (enquiryCreatedDate — LocalDateTime)
            if (createdDateFrom != null && !createdDateFrom.isBlank()) {
                LocalDateTime from = LocalDate.parse(createdDateFrom).atStartOfDay();
                predicates.add(cb.greaterThanOrEqualTo(root.get("enquiryCreatedDate"), from));
            }
            if (createdDateTo != null && !createdDateTo.isBlank()) {
                LocalDateTime to = LocalDate.parse(createdDateTo).plusDays(1).atStartOfDay();
                predicates.add(cb.lessThan(root.get("enquiryCreatedDate"), to));
            }

            // POL port filter — subquery: EXISTS (SELECT 1 FROM enquiry_pol WHERE enquiry_id = e.id AND port_id = ?)
            if (polPortId != null) {
                Subquery<Long> polSub = query.subquery(Long.class);
                Root<EnquiryPol> polRoot = polSub.from(EnquiryPol.class);
                polSub.select(cb.literal(1L));
                polSub.where(
                    cb.equal(polRoot.get("enquiryId"), root.get("id")),
                    cb.equal(polRoot.get("portId"), polPortId)
                );
                predicates.add(cb.exists(polSub));
            }

            // POD port filter — subquery: EXISTS (SELECT 1 FROM enquiry_pod WHERE enquiry_id = e.id AND port_id = ?)
            if (podPortId != null) {
                Subquery<Long> podSub = query.subquery(Long.class);
                Root<EnquiryPod> podRoot = podSub.from(EnquiryPod.class);
                podSub.select(cb.literal(1L));
                podSub.where(
                    cb.equal(podRoot.get("enquiryId"), root.get("id")),
                    cb.equal(podRoot.get("portId"), podPortId)
                );
                predicates.add(cb.exists(podSub));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
