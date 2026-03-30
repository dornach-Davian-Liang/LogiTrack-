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

/**
 * 憭葛??恣????v3
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EnquiryPortService {
    
    private final EnquiryPolRepository polRepository;
    private final EnquiryPodRepository podRepository;
    
    public List<Integer> getPolIds(Long enquiryId) {
        return polRepository.findByEnquiryId(enquiryId)
                .stream()
                .map(EnquiryPol::getPortId)
                .collect(Collectors.toList());
    }
    
    public List<Integer> getPodIds(Long enquiryId) {
        return podRepository.findByEnquiryId(enquiryId)
                .stream()
                .map(EnquiryPod::getPortId)
                .collect(Collectors.toList());
    }
    
    @Transactional
    public void savePolIds(Long enquiryId, List<Integer> portIds) {
        polRepository.deleteByEnquiryId(enquiryId);
        if (portIds != null && !portIds.isEmpty()) {
            List<EnquiryPol> polList = portIds.stream()
                    .map(portId -> {
                        EnquiryPol pol = new EnquiryPol();
                        pol.setEnquiryId(enquiryId);
                        pol.setPortId(portId);
                        return pol;
                    })
                    .collect(Collectors.toList());
            polRepository.saveAll(polList);
            log.info("Saved {} POL(s) for enquiry {}", polList.size(), enquiryId);
        }
    }
    
    @Transactional
    public void savePodIds(Long enquiryId, List<Integer> portIds) {
        podRepository.deleteByEnquiryId(enquiryId);
        if (portIds != null && !portIds.isEmpty()) {
            List<EnquiryPod> podList = portIds.stream()
                    .map(portId -> {
                        EnquiryPod pod = new EnquiryPod();
                        pod.setEnquiryId(enquiryId);
                        pod.setPortId(portId);
                        return pod;
                    })
                    .collect(Collectors.toList());
            podRepository.saveAll(podList);
            log.info("Saved {} POD(s) for enquiry {}", podList.size(), enquiryId);
        }
    }
}