package com.logitrack.backend.specification;

import com.logitrack.backend.entity.Enquiry;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.util.ArrayList;
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
            String dateTo) {

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

            // CN Office filter
            if (assignedCnOffice != null && !assignedCnOffice.isBlank()) {
                predicates.add(cb.equal(root.get("assignedCnOffice"), assignedCnOffice));
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

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
