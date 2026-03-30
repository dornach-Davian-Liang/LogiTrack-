package com.logitrack.backend.converter;

import com.logitrack.backend.entity.Enquiry;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * JPA Converter: OfferType enum ↔ DB ENUM string
 * Java: BUYER_CONSOL  ↔  DB: "BUYER-CONSOL"
 */
@Converter(autoApply = false)
public class OfferTypeConverter implements AttributeConverter<Enquiry.OfferType, String> {

    @Override
    public String convertToDatabaseColumn(Enquiry.OfferType type) {
        if (type == null) return null;
        return switch (type) {
            case FCL -> "FCL";
            case LCL -> "LCL";
            case AIR -> "AIR";
            case BUYER_CONSOL -> "BUYER-CONSOL";
        };
    }

    @Override
    public Enquiry.OfferType convertToEntityAttribute(String dbValue) {
        if (dbValue == null) return null;
        return Enquiry.OfferType.fromString(dbValue);
    }
}
