package com.logitrack.backend.controller;

import com.logitrack.backend.entity.*;
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
    private final ContainerTypeRepository containerTypeRepository;
    
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
            dto.setCountryCode(pic.getCountryCode());
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
                existing.setCountryCode(salesPic.getCountryCode());
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
    
    // ========== Sales Office 销售办公室 (只读) ==========
    
    @GetMapping("/sales-offices")
    public ResponseEntity<List<SalesOffice>> getAllSalesOffices() {
        log.info("GET /api/master/sales-offices");
        List<SalesOffice> offices = salesOfficeRepository.findAll();
        return ResponseEntity.ok(offices);
    }
    
    // ========== Container Type 箱型管理 ==========
    
    @GetMapping("/container-types")
    public ResponseEntity<List<ContainerType>> getAllContainerTypes() {
        log.info("GET /api/master/container-types");
        List<ContainerType> types = containerTypeRepository.findAll();
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
}
