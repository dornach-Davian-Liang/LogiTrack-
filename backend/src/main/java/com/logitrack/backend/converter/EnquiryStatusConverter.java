package com.logitrack.backend.converter;

import com.logitrack.backend.entity.Enquiry;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * JPA Converter: EnquiryStatus enum ↔ DB ENUM string
 * Java: Quoted_Pending  ↔  DB: "Quoted & Pending"
 */
@Converter(autoApply = false)
public class EnquiryStatusConverter implements AttributeConverter<Enquiry.EnquiryStatus, String> {

    @Override
    public String convertToDatabaseColumn(Enquiry.EnquiryStatus status) {
        if (status == null) return null;
        return switch (status) {
            case New -> "New";
            case Quoted_Pending -> "Quoted & Pending";
            case Secured -> "Secured";
            case Lost -> "Lost";
            case Cancelled -> "Cancelled";
        };
    }

    @Override
    public Enquiry.EnquiryStatus convertToEntityAttribute(String dbValue) {
        if (dbValue == null) return null;
        return Enquiry.EnquiryStatus.fromString(dbValue);
    }
}
