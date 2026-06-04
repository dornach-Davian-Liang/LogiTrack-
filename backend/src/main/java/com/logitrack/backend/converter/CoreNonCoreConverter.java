package com.logitrack.backend.converter;

import com.logitrack.backend.entity.Enquiry;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * JPA Converter: CoreNonCore enum ↔ DB ENUM string
 * Java: Non_Core  ↔  DB: "Non-Core"
 */
@Converter(autoApply = false)
public class CoreNonCoreConverter implements AttributeConverter<Enquiry.CoreNonCore, String> {

    @Override
    public String convertToDatabaseColumn(Enquiry.CoreNonCore value) {
        if (value == null) return null;
        return switch (value) {
            case Core -> "Core";
            case Non_Core -> "Non-Core";
        };
    }

    @Override
    public Enquiry.CoreNonCore convertToEntityAttribute(String dbValue) {
        if (dbValue == null) return null;
        return Enquiry.CoreNonCore.fromString(dbValue);
    }
}
