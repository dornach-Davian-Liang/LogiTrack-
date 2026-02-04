package com.logitrack.backend.controller;

import com.logitrack.backend.entity.*;
import com.logitrack.backend.repository.*;
import com.logitrack.backend.dto.DictDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 字典数据控制器 - 提供 Country, Port, SalesPic, SalesOffice 等字典数据
 */
@RestController
@RequestMapping("/api/dict")
@RequiredArgsConstructor
@Slf4j

public class DictController {
    
    private final CountryRepository countryRepository;
    private final PortRepository portRepository;
    private final SalesPicRepository salesPicRepository;
    private final SalesOfficeRepository salesOfficeRepository;
    private final CnOfficeRepository cnOfficeRepository;
    private final ContainerTypeRepository containerTypeRepository;
    private final CargoTypeRepository cargoTypeRepository;
    private final ProductRepository productRepository;
    
    // ========== Country 国家 ==========
    
    @GetMapping("/countries")
    public ResponseEntity<List<DictDTO>> getAllCountries() {
        log.info("GET /api/dict/countries");
        List<DictDTO> result = countryRepository.findByIsActiveTrueOrderByCountryNameEnAsc()
            .stream()
            .map(DictDTO::fromCountry)
            .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }
    
    // ========== Port 港口 ==========
    
    @GetMapping("/ports")
    public ResponseEntity<List<DictDTO.PortDTO>> getAllPorts() {
        log.info("GET /api/dict/ports");
        List<DictDTO.PortDTO> result = portRepository.findAll()
            .stream()
            .filter(Port::getIsActive)
            .map(DictDTO::fromPort)
            .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/ports/{id}")
    public ResponseEntity<Port> getPortById(@PathVariable Integer id) {
        log.info("GET /api/dict/ports/{}", id);
        return portRepository.findById(id)
            .filter(Port::getIsActive)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/ports/country/{countryCode}")
    public ResponseEntity<List<DictDTO.PortDTO>> getPortsByCountry(@PathVariable String countryCode) {
        log.info("GET /api/dict/ports/country/{}", countryCode);
        List<DictDTO.PortDTO> result = portRepository.findActivePortsByCountry(countryCode)
            .stream()
            .map(DictDTO::fromPort)
            .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }
    
    @GetMapping("/ports/search")
    public ResponseEntity<List<DictDTO.PortDTO>> searchPorts(@RequestParam String keyword) {
        log.info("GET /api/dict/ports/search?keyword={}", keyword);
        List<DictDTO.PortDTO> result = portRepository.searchPorts(keyword)
            .stream()
            .map(DictDTO::fromPort)
            .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/ports/search-v2")
    public ResponseEntity<List<DictDTO.PortDTO>> searchPortsV2(
        @RequestParam(required = false) String portType,
        @RequestParam(defaultValue = "") String keyword
    ) {
        log.info("GET /api/dict/ports/search-v2?portType={}&keyword={}", portType, keyword);
        List<Port> ports;
        if (keyword != null && !keyword.trim().isEmpty()) {
            ports = portRepository.searchPorts(keyword);
        } else {
            ports = portRepository.findAll();
        }
        List<DictDTO.PortDTO> result = ports.stream()
            .filter(Port::getIsActive)
            .filter(p -> portType == null || portType.isEmpty() || p.getPortType().name().equalsIgnoreCase(portType))
            .map(DictDTO::fromPort)
            .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }
    
    // ========== SalesPic 销售人员 ==========
    
    @GetMapping("/sales-countries")
    public ResponseEntity<List<DictDTO>> getSalesCountries() {
        log.info("GET /api/dict/sales-countries");
        // 获取所有有销售人员的国家（去重）
        List<String> countryCodes = salesPicRepository.findDistinctCountryCodes();
        List<DictDTO> result = new java.util.ArrayList<>();
        for (String countryCode : countryCodes) {
            Country country = countryRepository.findByCountryCode(countryCode).orElse(null);
            DictDTO item = new DictDTO(
                countryCode,
                country != null ? country.getCountryNameEn() : countryCode
            );
            result.add(item);
        }
        return ResponseEntity.ok(result);
    }
    
    @GetMapping("/sales-pics")
    public ResponseEntity<List<DictDTO.SalesPicDTO>> getAllSalesPics() {
        log.info("GET /api/dict/sales-pics");
        List<DictDTO.SalesPicDTO> result = salesPicRepository.findByIsActiveTrue()
            .stream()
            .map(pic -> {
                SalesOffice office = salesOfficeRepository.findById(pic.getSalesOfficeId()).orElse(null);
                return DictDTO.fromSalesPic(pic, office);
            })
            .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }
    
    @GetMapping("/sales-pics/country/{countryCode}")
    public ResponseEntity<List<DictDTO.SalesPicDTO>> getSalesPicsByCountry(@PathVariable String countryCode) {
        log.info("GET /api/dict/sales-pics/country/{}", countryCode);
        List<DictDTO.SalesPicDTO> result = salesPicRepository.findActiveSalesPicsByCountry(countryCode)
            .stream()
            .map(pic -> {
                SalesOffice office = salesOfficeRepository.findById(pic.getSalesOfficeId()).orElse(null);
                return DictDTO.fromSalesPic(pic, office);
            })
            .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }
    
    // ========== SalesOffice 销售办公室 ==========
    
    @GetMapping("/sales-offices")
    public ResponseEntity<List<DictDTO>> getAllSalesOffices() {
        log.info("GET /api/dict/sales-offices");
        List<DictDTO> result = salesOfficeRepository.findByIsActiveTrueOrderByNameAsc()
            .stream()
            .map(DictDTO::fromSalesOffice)
            .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/sales-offices/{id}")
    public ResponseEntity<SalesOffice> getSalesOfficeById(@PathVariable Integer id) {
        log.info("GET /api/dict/sales-offices/{}", id);
        return salesOfficeRepository.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
    
    // ========== CN Office 中国办公室 ==========
    
    @GetMapping("/cn-offices")
    public ResponseEntity<List<DictDTO>> getAllCnOffices() {
        log.info("GET /api/dict/cn-offices");
        List<DictDTO> result = cnOfficeRepository.findByIsActiveTrueOrderByNameAsc()
            .stream()
            .map(DictDTO::fromCnOffice)
            .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }
    
    // ========== Container Type 集装箱类型 ==========
    
    @GetMapping("/container-types")
    public ResponseEntity<List<DictDTO.ContainerTypeDTO>> getAllContainerTypes() {
        log.info("GET /api/dict/container-types");
        List<DictDTO.ContainerTypeDTO> result = containerTypeRepository.findByIsActiveTrueOrderByContainerCodeAsc()
            .stream()
            .map(DictDTO::fromContainerType)
            .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }
    
    // ========== Cargo Type 货物类型 ==========
    
    @GetMapping("/cargo-types")
    public ResponseEntity<List<DictDTO>> getAllCargoTypes() {
        log.info("GET /api/dict/cargo-types");
        List<DictDTO> result = cargoTypeRepository.findByIsActiveTrue()
            .stream()
            .map(DictDTO::fromCargoType)
            .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }
    
    @GetMapping("/cargo-types/offer-type/{offerType}")
    public ResponseEntity<List<DictDTO>> getCargoTypesByOfferType(@PathVariable String offerType) {
        log.info("GET /api/dict/cargo-types/offer-type/{}", offerType);
        try {
            CargoType.OfferType type = CargoType.OfferType.valueOf(offerType.toUpperCase());
            List<DictDTO> result = cargoTypeRepository.findByOfferTypeAndIsActiveTrue(type)
                .stream()
                .map(DictDTO::fromCargoType)
                .collect(Collectors.toList());
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    // ========== Product 产品 ==========
    
    @GetMapping("/products")
    public ResponseEntity<List<DictDTO>> getAllProducts() {
        log.info("GET /api/dict/products");
        List<DictDTO> result = productRepository.findByIsActiveTrueOrderByNameAsc()
            .stream()
            .map(DictDTO::fromProduct)
            .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }
}
