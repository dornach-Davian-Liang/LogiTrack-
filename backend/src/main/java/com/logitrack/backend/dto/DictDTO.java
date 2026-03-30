package com.logitrack.backend.dto;

import com.logitrack.backend.entity.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 字典数据DTO - 用于前端显示的统一格式
 */

/**
 * 通用下拉选项 {value, label} 格式
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DictDTO {
    public String value;
    public String label;

    /**
     * 国家选项
     */
    public static DictDTO fromCountry(Country country) {
        return new DictDTO(country.getCountryCode(), country.getCountryNameEn());
    }

    /**
     * 销售办公室选项
     */
    public static DictDTO fromCnOffice(CnOffice office) {
        return new DictDTO(office.getCode(), office.getName());
    }

    /**
     * 港口选项DTO - 包含额外字段
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PortDTO extends DictDTO {
        public String portCode;
        public String portType;
        public String countryCode;

        public PortDTO(String value, String label, String portCode, String portType, String countryCode) {
            super(value, label);
            this.portCode = portCode;
            this.portType = portType;
            this.countryCode = countryCode;
        }
    }

    /**
     * 港口选项 - 直接使用 portName（已含 Display name，如 "Durres, Albania"）
     */
    public static PortDTO fromPort(Port port) {
        String label = port.getPortName();
        return new PortDTO(
            String.valueOf(port.getId()),
            label,
            port.getPortCode(),
            port.getPortType().name(),  // Enum to String
            port.getCountryCode()
        );
    }

    /**
     * 销售人员选项DTO - 包含办公室信息
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SalesPicDTO extends DictDTO {
        public String countryCode;
        public Integer officeId;
        public String officeName;
        public String officeCode;

        public SalesPicDTO(String value, String label, String countryCode, Integer officeId, String officeName, String officeCode) {
            super(value, label);
            this.countryCode = countryCode;
            this.officeId = officeId;
            this.officeName = officeName;
            this.officeCode = officeCode;
        }
    }

    /**
     * 销售人员选项 - 需要传入 SalesOffice 来获取完整信息
     */
    public static SalesPicDTO fromSalesPic(SalesPic pic, SalesOffice office) {
        return new SalesPicDTO(
            String.valueOf(pic.getId()),
            pic.getName(),
            pic.getSalesCountryCode(),
            pic.getSalesOfficeId(),
            office != null ? office.getName() : "",
            office != null ? office.getCode() : ""
        );
    }

    /**
     * 销售办公室选项 - 重载版本
     */
    public static DictDTO fromSalesOffice(SalesOffice office) {
        return new DictDTO(String.valueOf(office.getId()), office.getName());
    }

    /**
     * 集装箱类型选项DTO - 包含额外字段
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ContainerTypeDTO extends DictDTO {
        public java.math.BigDecimal teuValue;
        public Boolean isSpecial;

        public ContainerTypeDTO(String value, String label, java.math.BigDecimal teuValue, Boolean isSpecial) {
            super(value, label);
            this.teuValue = teuValue;
            this.isSpecial = isSpecial;
        }
    }

    /**
     * 集装箱类型选项 - 格式: 20GP - 20' General Purpose
     */
    public static ContainerTypeDTO fromContainerType(ContainerType containerType) {
        String label = String.format("%s - %s", containerType.getContainerCode(), containerType.getContainerName());
        return new ContainerTypeDTO(
            String.valueOf(containerType.getId()),
            label,
            containerType.getTeuValue(),
            containerType.getIsSpecial()
        );
    }

    /**
     * 货物类型选项
     */
    public static DictDTO fromCargoType(CargoType cargoType) {
        return new DictDTO(cargoType.getCode(), cargoType.getName());
    }

    /**
     * 产品选项
     */
    public static DictDTO fromProduct(Product product) {
        return new DictDTO(product.getCode(), product.getName());
    }
}

