package com.logitrack.backend.controller;

import com.logitrack.backend.entity.*;
import com.logitrack.backend.entity.Currency;
import com.logitrack.backend.repository.*;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 主数据管理控制器 - 提供 Country, Port, SalesPic, ContainerType 的完整 CRUD 操作
 */
@RestController
@RequestMapping("/api/master")
@RequiredArgsConstructor
@Slf4j
public class MasterDataController {
    
    private final CountryRepository countryRepository;
    private final PortRepository portRepository;
    private final SalesPicRepository salesPicRepository;
    private final SalesOfficeRepository salesOfficeRepository;
    private final SalesCountryRepository salesCountryRepository;
    private final ContainerTypeRepository containerTypeRepository;
    private final CnPricingAdminRepository cnPricingAdminRepository;
    private final CarrierRepository carrierRepository;
    private final CurrencyRepository currencyRepository;
    
    // ========== Country 国家管理 ==========
    
    @GetMapping("/countries")
    public ResponseEntity<List<Country>> getAllCountries() {
        log.info("GET /api/master/countries");
        List<Country> countries = countryRepository.findAll();
        return ResponseEntity.ok(countries);
    }
    
    @GetMapping("/countries/{id}")
    public ResponseEntity<Country> getCountryById(@PathVariable Integer id) {
        log.info("GET /api/master/countries/{}", id);
        return countryRepository.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping("/countries")
    public ResponseEntity<Country> createCountry(@RequestBody Country country) {
        log.info("POST /api/master/countries: {}", country);
        country.setId(null); // 确保是新增
        Country saved = countryRepository.save(country);
        return ResponseEntity.ok(saved);
    }
    
    @PutMapping("/countries/{id}")
    public ResponseEntity<Country> updateCountry(@PathVariable Integer id, @RequestBody Country country) {
        log.info("PUT /api/master/countries/{}: {}", id, country);
        return countryRepository.findById(id)
            .map(existing -> {
                existing.setCountryCode(country.getCountryCode());
                existing.setCountryNameEn(country.getCountryNameEn());
                existing.setCountryNameCn(country.getCountryNameCn());
                existing.setIsActive(country.getIsActive());
                existing.setIsCore(country.getIsCore());
                Country updated = countryRepository.save(existing);
                return ResponseEntity.ok(updated);
            })
            .orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/countries/{id}")
    public ResponseEntity<Void> deleteCountry(@PathVariable Integer id) {
        log.info("DELETE /api/master/countries/{}", id);
        if (countryRepository.existsById(id)) {
            countryRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
    
    // ========== Port 港口管理 ==========
    
    @GetMapping("/ports")
    public ResponseEntity<List<Port>> getAllPorts() {
        log.info("GET /api/master/ports");
        List<Port> ports = portRepository.findAll();
        return ResponseEntity.ok(ports);
    }
    
    @GetMapping("/ports/{id}")
    public ResponseEntity<Port> getPortById(@PathVariable Integer id) {
        log.info("GET /api/master/ports/{}", id);
        return portRepository.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping("/ports")
    public ResponseEntity<Port> createPort(@RequestBody Port port) {
        log.info("POST /api/master/ports: {}", port);
        port.setId(null); // 确保是新增
        Port saved = portRepository.save(port);
        return ResponseEntity.ok(saved);
    }
    
    @PutMapping("/ports/{id}")
    public ResponseEntity<Port> updatePort(@PathVariable Integer id, @RequestBody Port port) {
        log.info("PUT /api/master/ports/{}: {}", id, port);
        return portRepository.findById(id)
            .map(existing -> {
                existing.setPortCode(port.getPortCode());
                existing.setPortName(port.getPortName());
                existing.setPortType(port.getPortType());
                existing.setCountryCode(port.getCountryCode());
                existing.setCity(port.getCity());
                existing.setIsActive(port.getIsActive());
                Port updated = portRepository.save(existing);
                return ResponseEntity.ok(updated);
            })
            .orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/ports/{id}")
    public ResponseEntity<Void> deletePort(@PathVariable Integer id) {
        log.info("DELETE /api/master/ports/{}", id);
        if (portRepository.existsById(id)) {
            portRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
    
    // ========== Sales PIC 销售人员管理 ==========
    
    /**
     * SalesPic 展示 DTO - 包含 office 名称和代码
     */
    @Data
    public static class SalesPicResponse {
        private Integer id;
        private String name;
        private String countryCode;
        private Integer salesOfficeId;
        private String salesOfficeName;
        private String salesOfficeCode;
        private Boolean isActive;
        
        public static SalesPicResponse from(SalesPic pic, SalesOffice office) {
            SalesPicResponse dto = new SalesPicResponse();
            dto.setId(pic.getId());
            dto.setName(pic.getName());
            dto.setCountryCode(pic.getSalesCountryCode());
            dto.setSalesOfficeId(pic.getSalesOfficeId());
            dto.setSalesOfficeName(office != null ? office.getName() : null);
            dto.setSalesOfficeCode(office != null ? office.getCode() : null);
            dto.setIsActive(pic.getIsActive());
            return dto;
        }
    }
    
    @GetMapping("/sales-pics")
    public ResponseEntity<List<SalesPicResponse>> getAllSalesPics() {
        log.info("GET /api/master/sales-pics");
        List<SalesPicResponse> salesPics = salesPicRepository.findAll()
            .stream()
            .map(pic -> {
                SalesOffice office = salesOfficeRepository.findById(pic.getSalesOfficeId()).orElse(null);
                return SalesPicResponse.from(pic, office);
            })
            .collect(Collectors.toList());
        return ResponseEntity.ok(salesPics);
    }
    
    @GetMapping("/sales-pics/{id}")
    public ResponseEntity<SalesPicResponse> getSalesPicById(@PathVariable Integer id) {
        log.info("GET /api/master/sales-pics/{}", id);
        return salesPicRepository.findById(id)
            .map(pic -> {
                SalesOffice office = salesOfficeRepository.findById(pic.getSalesOfficeId()).orElse(null);
                return ResponseEntity.ok(SalesPicResponse.from(pic, office));
            })
            .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping("/sales-pics")
    public ResponseEntity<SalesPicResponse> createSalesPic(@RequestBody SalesPic salesPic) {
        log.info("POST /api/master/sales-pics: {}", salesPic);
        salesPic.setId(null); // 确保是新增
        SalesPic saved = salesPicRepository.save(salesPic);
        SalesOffice office = salesOfficeRepository.findById(saved.getSalesOfficeId()).orElse(null);
        return ResponseEntity.ok(SalesPicResponse.from(saved, office));
    }
    
    @PutMapping("/sales-pics/{id}")
    public ResponseEntity<SalesPicResponse> updateSalesPic(@PathVariable Integer id, @RequestBody SalesPic salesPic) {
        log.info("PUT /api/master/sales-pics/{}: {}", id, salesPic);
        return salesPicRepository.findById(id)
            .map(existing -> {
                existing.setName(salesPic.getName());
                existing.setSalesCountryCode(salesPic.getSalesCountryCode());
                existing.setSalesOfficeId(salesPic.getSalesOfficeId());
                existing.setIsActive(salesPic.getIsActive());
                SalesPic updated = salesPicRepository.save(existing);
                SalesOffice office = salesOfficeRepository.findById(updated.getSalesOfficeId()).orElse(null);
                return ResponseEntity.ok(SalesPicResponse.from(updated, office));
            })
            .orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/sales-pics/{id}")
    public ResponseEntity<Void> deleteSalesPic(@PathVariable Integer id) {
        log.info("DELETE /api/master/sales-pics/{}", id);
        if (salesPicRepository.existsById(id)) {
            salesPicRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
    
    // ========== Sales Country 销售国家管理 ==========
    
    @GetMapping("/sales-countries")
    public ResponseEntity<List<SalesCountry>> getAllSalesCountries() {
        log.info("GET /api/master/sales-countries");
        List<SalesCountry> countries = salesCountryRepository.findAll();
        countries.sort((a, b) -> Integer.compare(
            a.getSortOrder() != null ? a.getSortOrder() : 0,
            b.getSortOrder() != null ? b.getSortOrder() : 0));
        return ResponseEntity.ok(countries);
    }
    
    @GetMapping("/sales-countries/{code}")
    public ResponseEntity<SalesCountry> getSalesCountryByCode(@PathVariable String code) {
        log.info("GET /api/master/sales-countries/{}", code);
        return salesCountryRepository.findById(code)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping("/sales-countries")
    public ResponseEntity<SalesCountry> createSalesCountry(@RequestBody SalesCountry country) {
        log.info("POST /api/master/sales-countries: {}", country);
        if (salesCountryRepository.existsById(country.getCode())) {
            return ResponseEntity.badRequest().build();
        }
        SalesCountry saved = salesCountryRepository.save(country);
        return ResponseEntity.ok(saved);
    }
    
    @PutMapping("/sales-countries/{code}")
    public ResponseEntity<SalesCountry> updateSalesCountry(@PathVariable String code, @RequestBody SalesCountry country) {
        log.info("PUT /api/master/sales-countries/{}: {}", code, country);
        return salesCountryRepository.findById(code)
            .map(existing -> {
                existing.setName(country.getName());
                existing.setSortOrder(country.getSortOrder());
                existing.setIsActive(country.getIsActive());
                SalesCountry updated = salesCountryRepository.save(existing);
                return ResponseEntity.ok(updated);
            })
            .orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/sales-countries/{code}")
    public ResponseEntity<Void> deleteSalesCountry(@PathVariable String code) {
        log.info("DELETE /api/master/sales-countries/{}", code);
        // Check if any offices reference this country
        List<SalesOffice> offices = salesOfficeRepository.findBySalesCountryCode(code);
        if (!offices.isEmpty()) {
            log.warn("Cannot delete sales country {} - {} offices still reference it", code, offices.size());
            return ResponseEntity.badRequest().build();
        }
        if (salesCountryRepository.existsById(code)) {
            salesCountryRepository.deleteById(code);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
    
    // ========== Sales Office 销售办公室管理 ==========
    
    @GetMapping("/sales-offices")
    public ResponseEntity<List<SalesOffice>> getAllSalesOffices(
            @RequestParam(required = false) String salesCountryCode) {
        log.info("GET /api/master/sales-offices (salesCountryCode={})", salesCountryCode);
        List<SalesOffice> offices;
        if (salesCountryCode != null && !salesCountryCode.isEmpty()) {
            offices = salesOfficeRepository.findBySalesCountryCodeOrderByNameAsc(salesCountryCode);
        } else {
            offices = salesOfficeRepository.findAll();
        }
        return ResponseEntity.ok(offices);
    }
    
    @GetMapping("/sales-offices/{id}")
    public ResponseEntity<SalesOffice> getSalesOfficeById(@PathVariable Integer id) {
        log.info("GET /api/master/sales-offices/{}", id);
        return salesOfficeRepository.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping("/sales-offices")
    public ResponseEntity<SalesOffice> createSalesOffice(@RequestBody SalesOffice office) {
        log.info("POST /api/master/sales-offices: {}", office);
        office.setId(null);
        // Auto-generate code if not provided
        if (office.getCode() == null || office.getCode().isEmpty()) {
            String nameClean = office.getName().replaceAll("[^A-Za-z0-9]", "").toUpperCase();
            office.setCode(nameClean.substring(0, Math.min(10, nameClean.length())) + "_" + System.currentTimeMillis() % 10000);
        }
        // Auto-generate nameNorm
        String prefix = office.getSalesCountryCode() != null ? office.getSalesCountryCode() + ":" : "";
        office.setNameNorm(prefix + office.getName().toUpperCase().trim());
        SalesOffice saved = salesOfficeRepository.save(office);
        return ResponseEntity.ok(saved);
    }
    
    @PutMapping("/sales-offices/{id}")
    public ResponseEntity<SalesOffice> updateSalesOffice(@PathVariable Integer id, @RequestBody SalesOffice office) {
        log.info("PUT /api/master/sales-offices/{}: {}", id, office);
        return salesOfficeRepository.findById(id)
            .map(existing -> {
                existing.setName(office.getName());
                existing.setSalesCountryCode(office.getSalesCountryCode());
                existing.setIsActive(office.getIsActive());
                existing.setRemark(office.getRemark());
                // Update nameNorm
                String prefix = office.getSalesCountryCode() != null ? office.getSalesCountryCode() + ":" : "";
                existing.setNameNorm(prefix + office.getName().toUpperCase().trim());
                SalesOffice updated = salesOfficeRepository.save(existing);
                return ResponseEntity.ok(updated);
            })
            .orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/sales-offices/{id}")
    public ResponseEntity<Void> deleteSalesOffice(@PathVariable Integer id) {
        log.info("DELETE /api/master/sales-offices/{}", id);
        // Check if any PICs reference this office
        List<SalesPic> pics = salesPicRepository.findBySalesOfficeId(id);
        if (!pics.isEmpty()) {
            log.warn("Cannot delete sales office {} - {} PICs still reference it", id, pics.size());
            return ResponseEntity.badRequest().build();
        }
        if (salesOfficeRepository.existsById(id)) {
            salesOfficeRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
    
    // ========== Container Type 箱型管理 ==========
    
    @GetMapping("/container-types")
    public ResponseEntity<List<ContainerType>> getAllContainerTypes() {
        log.info("GET /api/master/container-types");
        List<ContainerType> types = containerTypeRepository.findAllByOrderByContainerCodeAsc();
        return ResponseEntity.ok(types);
    }
    
    @GetMapping("/container-types/{id}")
    public ResponseEntity<ContainerType> getContainerTypeById(@PathVariable Integer id) {
        log.info("GET /api/master/container-types/{}", id);
        return containerTypeRepository.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping("/container-types")
    public ResponseEntity<ContainerType> createContainerType(@RequestBody ContainerType containerType) {
        log.info("POST /api/master/container-types: {}", containerType);
        containerType.setId(null); // 确保是新增
        ContainerType saved = containerTypeRepository.save(containerType);
        return ResponseEntity.ok(saved);
    }
    
    @PutMapping("/container-types/{id}")
    public ResponseEntity<ContainerType> updateContainerType(@PathVariable Integer id, @RequestBody ContainerType containerType) {
        log.info("PUT /api/master/container-types/{}: {}", id, containerType);
        return containerTypeRepository.findById(id)
            .map(existing -> {
                existing.setContainerCode(containerType.getContainerCode());
                existing.setContainerName(containerType.getContainerName());
                existing.setTeuValue(containerType.getTeuValue());
                existing.setLengthFeet(containerType.getLengthFeet());
                existing.setIsSpecial(containerType.getIsSpecial());
                existing.setIsActive(containerType.getIsActive());
                ContainerType updated = containerTypeRepository.save(existing);
                return ResponseEntity.ok(updated);
            })
            .orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/container-types/{id}")
    public ResponseEntity<Void> deleteContainerType(@PathVariable Integer id) {
        log.info("DELETE /api/master/container-types/{}", id);
        if (containerTypeRepository.existsById(id)) {
            containerTypeRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
    
    // ========== CN Pricing Admin 定价管理员字典 ==========
    
    @GetMapping("/cn-pricing-admins")
    public ResponseEntity<List<CnPricingAdmin>> getAllCnPricingAdmins() {
        log.info("GET /api/master/cn-pricing-admins");
        List<CnPricingAdmin> admins = cnPricingAdminRepository.findAllByOrderByDisplayOrderAscNameAsc();
        return ResponseEntity.ok(admins);
    }
    
    @GetMapping("/cn-pricing-admins/active")
    public ResponseEntity<List<CnPricingAdmin>> getActiveCnPricingAdmins() {
        log.info("GET /api/master/cn-pricing-admins/active");
        List<CnPricingAdmin> admins = cnPricingAdminRepository.findByIsActiveTrueOrderByDisplayOrderAscNameAsc();
        return ResponseEntity.ok(admins);
    }
    
    @GetMapping("/cn-pricing-admins/{id}")
    public ResponseEntity<CnPricingAdmin> getCnPricingAdminById(@PathVariable Integer id) {
        log.info("GET /api/master/cn-pricing-admins/{}", id);
        return cnPricingAdminRepository.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping("/cn-pricing-admins")
    public ResponseEntity<CnPricingAdmin> createCnPricingAdmin(@RequestBody CnPricingAdmin admin) {
        log.info("POST /api/master/cn-pricing-admins: {}", admin);
        admin.setId(null); // 确保是新增
        CnPricingAdmin saved = cnPricingAdminRepository.save(admin);
        return ResponseEntity.ok(saved);
    }
    
    @PutMapping("/cn-pricing-admins/{id}")
    public ResponseEntity<CnPricingAdmin> updateCnPricingAdmin(@PathVariable Integer id, @RequestBody CnPricingAdmin admin) {
        log.info("PUT /api/master/cn-pricing-admins/{}: {}", id, admin);
        return cnPricingAdminRepository.findById(id)
            .map(existing -> {
                existing.setName(admin.getName());
                existing.setDisplayOrder(admin.getDisplayOrder());
                existing.setIsActive(admin.getIsActive());
                CnPricingAdmin updated = cnPricingAdminRepository.save(existing);
                return ResponseEntity.ok(updated);
            })
            .orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/cn-pricing-admins/{id}")
    public ResponseEntity<Void> deleteCnPricingAdmin(@PathVariable Integer id) {
        log.info("DELETE /api/master/cn-pricing-admins/{}", id);
        if (cnPricingAdminRepository.existsById(id)) {
            cnPricingAdminRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
    
    // ========== Carrier 承运商字典 ==========
    
    @GetMapping("/carriers")
    public ResponseEntity<List<Carrier>> getAllCarriers() {
        log.info("GET /api/master/carriers");
        List<Carrier> carriers = carrierRepository.findAllByOrderBySortOrderAscCarrierNameAsc();
        return ResponseEntity.ok(carriers);
    }
    
    @GetMapping("/carriers/active")
    public ResponseEntity<List<Carrier>> getActiveCarriers() {
        log.info("GET /api/master/carriers/active");
        List<Carrier> carriers = carrierRepository.findByIsActiveTrueOrderBySortOrderAscCarrierNameAsc();
        return ResponseEntity.ok(carriers);
    }
    
    @GetMapping("/carriers/{id}")
    public ResponseEntity<Carrier> getCarrierById(@PathVariable Integer id) {
        log.info("GET /api/master/carriers/{}", id);
        return carrierRepository.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping("/carriers")
    public ResponseEntity<Carrier> createCarrier(@RequestBody Carrier carrier) {
        log.info("POST /api/master/carriers: {}", carrier);
        carrier.setId(null);
        Carrier saved = carrierRepository.save(carrier);
        return ResponseEntity.ok(saved);
    }
    
    @PutMapping("/carriers/{id}")
    public ResponseEntity<Carrier> updateCarrier(@PathVariable Integer id, @RequestBody Carrier carrier) {
        log.info("PUT /api/master/carriers/{}: {}", id, carrier);
        return carrierRepository.findById(id)
            .map(existing -> {
                existing.setCarrierCode(carrier.getCarrierCode());
                existing.setCarrierName(carrier.getCarrierName());
                existing.setSortOrder(carrier.getSortOrder());
                existing.setIsActive(carrier.getIsActive());
                Carrier updated = carrierRepository.save(existing);
                return ResponseEntity.ok(updated);
            })
            .orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/carriers/{id}")
    public ResponseEntity<Void> deleteCarrier(@PathVariable Integer id) {
        log.info("DELETE /api/master/carriers/{}", id);
        if (carrierRepository.existsById(id)) {
            carrierRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    // ========== Currency 货币管理 ==========

    @GetMapping("/currencies")
    public ResponseEntity<List<Currency>> getAllCurrencies() {
        log.info("GET /api/master/currencies");
        return ResponseEntity.ok(currencyRepository.findAllByOrderBySortOrderAscCurrencyCodeAsc());
    }

    @GetMapping("/currencies/active")
    public ResponseEntity<List<Currency>> getActiveCurrencies() {
        log.info("GET /api/master/currencies/active");
        return ResponseEntity.ok(currencyRepository.findByIsActiveTrueOrderBySortOrderAscCurrencyCodeAsc());
    }

    @PostMapping("/currencies")
    public ResponseEntity<Currency> createCurrency(@RequestBody Currency currency) {
        log.info("POST /api/master/currencies: {}", currency);
        currency.setId(null);
        Currency saved = currencyRepository.save(currency);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/currencies/{id}")
    public ResponseEntity<Currency> updateCurrency(@PathVariable Integer id, @RequestBody Currency currency) {
        log.info("PUT /api/master/currencies/{}: {}", id, currency);
        return currencyRepository.findById(id)
            .map(existing -> {
                existing.setCurrencyCode(currency.getCurrencyCode());
                existing.setCurrencyName(currency.getCurrencyName());
                existing.setIsActive(currency.getIsActive());
                existing.setSortOrder(currency.getSortOrder());
                Currency updated = currencyRepository.save(existing);
                return ResponseEntity.ok(updated);
            })
            .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/currencies/{id}")
    public ResponseEntity<Void> deleteCurrency(@PathVariable Integer id) {
        log.info("DELETE /api/master/currencies/{}", id);
        if (currencyRepository.existsById(id)) {
            currencyRepository.deleteById(id);
            return ResponseEntity.ok().<Void>build();
        }
        return ResponseEntity.notFound().build();
    }
}
