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
 * 字典数据控制器 v3 — 符合 API 端点规范
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
    private final SalesCountryRepository salesCountryRepository;
    private final ContainerTypeRepository containerTypeRepository;
    private final CargoTypeRepository cargoTypeRepository;
    private final ProductRepository productRepository;
    private final ProductCargoAllowedRepository productCargoAllowedRepository;
    private final CancelledReasonRepository cancelledReasonRepository;
    private final LostReasonRepository lostReasonRepository;
    private final CarrierRepository carrierRepository;
    
    // ========== Product 产品 ==========
    
    /**
     * GET /api/dict/products — 产品类型列表
     */
    @GetMapping("/products")
    public ResponseEntity<List<Product>> getAllProducts() {
        log.info("GET /api/dict/products");
        List<Product> result = productRepository.findByIsActiveTrueOrderBySortOrderAsc();
        return ResponseEntity.ok(result);
    }
    
    // ========== Cargo Type ==========
    
    /**
     * GET /api/dict/cargo-types?productCode=SEA — 按产品过滤Cargo类型
     */
    @GetMapping("/cargo-types")
    public ResponseEntity<List<CargoType>> getCargoTypes(
            @RequestParam(required = false) String productCode) {
        log.info("GET /api/dict/cargo-types?productCode={}", productCode);
        
        if (productCode != null && !productCode.isBlank()) {
            // 查找 allowed cargo type codes
            List<String> allowedCodes = productCargoAllowedRepository
                    .findCargoTypeCodesByProductCode(productCode);
            List<CargoType> result = cargoTypeRepository.findByIsActiveTrue()
                    .stream()
                    .filter(ct -> allowedCodes.contains(ct.getCode()))
                    .collect(Collectors.toList());
            return ResponseEntity.ok(result);
        }
        
        return ResponseEntity.ok(cargoTypeRepository.findByIsActiveTrue());
    }
    
    // ========== Sales Country ==========
    
    /**
     * GET /api/dict/sales-countries — 销售国家列表
     */
    @GetMapping("/sales-countries")
    public ResponseEntity<List<DictDTO>> getSalesCountries() {
        log.info("GET /api/dict/sales-countries");
        List<DictDTO> result = salesCountryRepository.findByIsActiveTrueOrderBySortOrderAsc()
                .stream()
                .map(sc -> new DictDTO(sc.getCode(), sc.getName()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }
    
    // ========== Sales PIC ==========
    
    /**
     * GET /api/dict/sales-pics?countryCode=Z-UK — 按国家过滤PIC列表
     */
    @GetMapping("/sales-pics")
    public ResponseEntity<List<DictDTO.SalesPicDTO>> getSalesPics(
            @RequestParam(required = false) String countryCode) {
        log.info("GET /api/dict/sales-pics?countryCode={}", countryCode);
        
        List<SalesPic> pics;
        if (countryCode != null && !countryCode.isBlank()) {
            pics = salesPicRepository.findActiveSalesPicsByCountry(countryCode);
        } else {
            pics = salesPicRepository.findByIsActiveTrue();
        }
        
        List<DictDTO.SalesPicDTO> result = pics.stream()
                .map(pic -> {
                    SalesOffice office = salesOfficeRepository.findById(pic.getSalesOfficeId()).orElse(null);
                    return DictDTO.fromSalesPic(pic, office);
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }
    
    // ========== Sales Office ==========
    
    /**
     * GET /api/dict/sales-offices?picId=123 — 按PIC获取Office（1:1）
     */
    @GetMapping("/sales-offices")
    public ResponseEntity<?> getSalesOffices(
            @RequestParam(required = false) Integer picId) {
        log.info("GET /api/dict/sales-offices?picId={}", picId);
        
        if (picId != null) {
            // 按 PIC 获取对应 Office（1:1映射）
            return salesPicRepository.findById(picId)
                    .flatMap(pic -> salesOfficeRepository.findById(pic.getSalesOfficeId()))
                    .map(office -> ResponseEntity.ok((Object) office))
                    .orElse(ResponseEntity.notFound().build());
        }
        
        List<DictDTO> result = salesOfficeRepository.findByIsActiveTrueOrderByNameAsc()
                .stream()
                .map(DictDTO::fromSalesOffice)
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }
    
    // ========== Port 端口 ==========
    
    /**
     * GET /api/ports?mode=AIR&query=sha — 端口搜索（按mode过滤）
     * 注意：此端点路径在 /api/ports（不在 /api/dict 下）
     */
    @GetMapping("/ports")
    public ResponseEntity<List<DictDTO.PortDTO>> searchPorts(
            @RequestParam(required = false) String mode,
            @RequestParam(required = false, defaultValue = "") String query) {
        log.info("GET /api/dict/ports?mode={}&query={}", mode, query);
        
        List<Port> ports;
        if (query != null && !query.trim().isEmpty()) {
            ports = portRepository.searchPorts(query);
        } else {
            ports = portRepository.findAll();
        }
        
        List<DictDTO.PortDTO> result = ports.stream()
                .filter(Port::getIsActive)
                .filter(p -> mode == null || mode.isEmpty() 
                        || p.getPortType().name().equalsIgnoreCase(mode))
                .map(DictDTO::fromPort)
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/ports/{id}")
    public ResponseEntity<Port> getPortById(@PathVariable Integer id) {
        return portRepository.findById(id)
                .filter(Port::getIsActive)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    // ========== Cancelled & Lost Reasons ==========
    
    /**
     * GET /api/dict/cancelled-reasons
     */
    @GetMapping("/cancelled-reasons")
    public ResponseEntity<List<CancelledReason>> getCancelledReasons() {
        log.info("GET /api/dict/cancelled-reasons");
        return ResponseEntity.ok(cancelledReasonRepository.findAllByOrderBySortOrderAsc());
    }
    
    /**
     * GET /api/dict/lost-reasons
     */
    @GetMapping("/lost-reasons")
    public ResponseEntity<List<LostReason>> getLostReasons() {
        log.info("GET /api/dict/lost-reasons");
        return ResponseEntity.ok(lostReasonRepository.findAllByOrderBySortOrderAsc());
    }
    
    // ========== 兼容旧端点 ==========
    
    @GetMapping("/countries")
    public ResponseEntity<List<DictDTO>> getAllCountries() {
        List<DictDTO> result = countryRepository.findByIsActiveTrueOrderByCountryNameEnAsc()
                .stream()
                .map(DictDTO::fromCountry)
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }
    
    @GetMapping("/container-types")
    public ResponseEntity<List<DictDTO.ContainerTypeDTO>> getAllContainerTypes() {
        List<DictDTO.ContainerTypeDTO> result = containerTypeRepository.findByIsActiveTrueOrderByContainerCodeAsc()
                .stream()
                .map(DictDTO::fromContainerType)
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }
    
    @GetMapping("/carriers")
    public ResponseEntity<List<Carrier>> getActiveCarriers() {
        List<Carrier> carriers = carrierRepository.findByIsActiveTrueOrderBySortOrderAscCarrierNameAsc();
        return ResponseEntity.ok(carriers);
    }
}
    
