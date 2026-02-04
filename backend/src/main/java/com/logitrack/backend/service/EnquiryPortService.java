package com.logitrack.backend.service;

import com.logitrack.backend.entity.EnquiryPol;
import com.logitrack.backend.entity.EnquiryPod;
import com.logitrack.backend.repository.EnquiryPolRepository;
import com.logitrack.backend.repository.EnquiryPodRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

/**
 * 多港口管理服务
 * 处理 Enquiry 的多个 POL/POD
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EnquiryPortService {
    
    private final EnquiryPolRepository polRepository;
    private final EnquiryPodRepository podRepository;
    
    /**
     * 获取询价的所有起运港 ID
     */
    public List<Integer> getPolIds(Long enquiryId) {
        return polRepository.findByEnquiryIdOrderBySequence(enquiryId)
                .stream()
                .map(EnquiryPol::getPortId)
                .collect(Collectors.toList());
    }
    
    /**
     * 获取询价的所有目的港 ID
     */
    public List<Integer> getPodIds(Long enquiryId) {
        return podRepository.findByEnquiryIdOrderBySequence(enquiryId)
                .stream()
                .map(EnquiryPod::getPortId)
                .collect(Collectors.toList());
    }
    
    /**
     * 保存起运港列表
     * @param enquiryId 询价ID
     * @param portIds 港口ID列表
     */
    @Transactional
    public void savePolIds(Long enquiryId, List<Integer> portIds) {
        // 1. 删除旧的关联
        polRepository.deleteByEnquiryId(enquiryId);
        
        // 2. 插入新的关联
        if (portIds != null && !portIds.isEmpty()) {
            List<EnquiryPol> polList = IntStream.range(0, portIds.size())
                    .mapToObj(i -> {
                        EnquiryPol pol = new EnquiryPol();
                        pol.setEnquiryId(enquiryId);
                        pol.setPortId(portIds.get(i));
                        pol.setSequence(i + 1);  // 顺序从1开始
                        return pol;
                    })
                    .collect(Collectors.toList());
            
            polRepository.saveAll(polList);
            log.info("Saved {} POL(s) for enquiry {}", polList.size(), enquiryId);
        }
    }
    
    /**
     * 保存目的港列表
     * @param enquiryId 询价ID
     * @param portIds 港口ID列表
     */
    @Transactional
    public void savePodIds(Long enquiryId, List<Integer> portIds) {
        // 1. 删除旧的关联
        podRepository.deleteByEnquiryId(enquiryId);
        
        // 2. 插入新的关联
        if (portIds != null && !portIds.isEmpty()) {
            List<EnquiryPod> podList = IntStream.range(0, portIds.size())
                    .mapToObj(i -> {
                        EnquiryPod pod = new EnquiryPod();
                        pod.setEnquiryId(enquiryId);
                        pod.setPortId(portIds.get(i));
                        pod.setSequence(i + 1);  // 顺序从1开始
                        return pod;
                    })
                    .collect(Collectors.toList());
            
            podRepository.saveAll(podList);
            log.info("Saved {} POD(s) for enquiry {}", podList.size(), enquiryId);
        }
    }
    
    /**
     * 删除询价的所有港口关联
     */
    @Transactional
    public void deleteAllPorts(Long enquiryId) {
        polRepository.deleteByEnquiryId(enquiryId);
        podRepository.deleteByEnquiryId(enquiryId);
        log.info("Deleted all port associations for enquiry {}", enquiryId);
    }
}
