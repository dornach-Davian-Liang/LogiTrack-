package com.logitrack.backend.controller;

import com.logitrack.backend.entity.*;
import com.logitrack.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
    public ResponseEntity<List<Country>> getAllCountries() {
        log.info("GET /api/dict/countries");
        return ResponseEntity.ok(countryRepository.findByIsActiveTrueOrderByCountryNameEnAsc());
    }
    
    // ========== Port 港口 ==========
    
    @GetMapping("/ports")
    public ResponseEntity<List<Port>> getAllPorts() {
        log.info("GET /api/dict/ports");
        return ResponseEntity.ok(portRepository.findAll());
    }
    
    @GetMapping("/ports/country/{countryCode}")
    public ResponseEntity<List<Port>> getPortsByCountry(@PathVariable String countryCode) {
        log.info("GET /api/dict/ports/country/{}", countryCode);
        return ResponseEntity.ok(portRepository.findActivePortsByCountry(countryCode));
    }
    
    @GetMapping("/ports/search")
    public ResponseEntity<List<Port>> searchPorts(@RequestParam String keyword) {
        log.info("GET /api/dict/ports/search?keyword={}", keyword);
        return ResponseEntity.ok(portRepository.searchPorts(keyword));
    }
    
    // ========== SalesPic 销售人员 ==========
    
    @GetMapping("/sales-pics")
    public ResponseEntity<List<SalesPic>> getAllSalesPics() {
        log.info("GET /api/dict/sales-pics");
        return ResponseEntity.ok(salesPicRepository.findByIsActiveTrue());
    }
    
    @GetMapping("/sales-pics/country/{countryCode}")
    public ResponseEntity<List<SalesPic>> getSalesPicsByCountry(@PathVariable String countryCode) {
        log.info("GET /api/dict/sales-pics/country/{}", countryCode);
        return ResponseEntity.ok(salesPicRepository.findActiveSalesPicsByCountry(countryCode));
    }
    
    // ========== SalesOffice 销售办公室 ==========
    
    @GetMapping("/sales-offices")
    public ResponseEntity<List<SalesOffice>> getAllSalesOffices() {
        log.info("GET /api/dict/sales-offices");
        return ResponseEntity.ok(salesOfficeRepository.findByIsActiveTrueOrderByNameAsc());
    }
    
    // ========== CN Office 中国办公室 ==========
    
    @GetMapping("/cn-offices")
    public ResponseEntity<List<CnOffice>> getAllCnOffices() {
        log.info("GET /api/dict/cn-offices");
        return ResponseEntity.ok(cnOfficeRepository.findByIsActiveTrueOrderByNameAsc());
    }
    
    // ========== Container Type 集装箱类型 ==========
    
    @GetMapping("/container-types")
    public ResponseEntity<List<ContainerType>> getAllContainerTypes() {
        log.info("GET /api/dict/container-types");
        return ResponseEntity.ok(containerTypeRepository.findByIsActiveTrueOrderByContainerCodeAsc());
    }
    
    // ========== Cargo Type 货物类型 ==========
    
    @GetMapping("/cargo-types")
    public ResponseEntity<List<CargoType>> getAllCargoTypes() {
        log.info("GET /api/dict/cargo-types");
        return ResponseEntity.ok(cargoTypeRepository.findByIsActiveTrue());
    }
    
    @GetMapping("/cargo-types/offer-type/{offerType}")
    public ResponseEntity<List<CargoType>> getCargoTypesByOfferType(@PathVariable String offerType) {
        log.info("GET /api/dict/cargo-types/offer-type/{}", offerType);
        try {
            CargoType.OfferType type = CargoType.OfferType.valueOf(offerType.toUpperCase());
            return ResponseEntity.ok(cargoTypeRepository.findByOfferTypeAndIsActiveTrue(type));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    // ========== Product 产品 ==========
    
    @GetMapping("/products")
    public ResponseEntity<List<Product>> getAllProducts() {
        log.info("GET /api/dict/products");
        return ResponseEntity.ok(productRepository.findByIsActiveTrueOrderByNameAsc());
    }
}
