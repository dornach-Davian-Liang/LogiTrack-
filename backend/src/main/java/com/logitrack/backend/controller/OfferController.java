package com.logitrack.backend.controller;

import com.logitrack.backend.entity.Enquiry;
import com.logitrack.backend.entity.Offer;
import com.logitrack.backend.repository.EnquiryRepository;
import com.logitrack.backend.repository.OfferRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Slf4j
public class OfferController {

    private final OfferRepository offerRepository;
    private final EnquiryRepository enquiryRepository;

    /**
     * GET /api/enquiries/{enquiryId}/offers - Get offers by enquiry id
     */
    @GetMapping("/enquiries/{enquiryId}/offers")
    public ResponseEntity<List<Offer>> getOffersByEnquiry(@PathVariable Long enquiryId) {
        log.info("GET /api/enquiries/{}/offers - Fetching offers", enquiryId);
        if (!enquiryRepository.existsById(enquiryId)) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(offerRepository.findByEnquiryId(enquiryId));
    }

    /**
     * POST /api/enquiries/{enquiryId}/offers - Create offer for enquiry
     */
    @PostMapping("/enquiries/{enquiryId}/offers")
    public ResponseEntity<?> createOffer(@PathVariable Long enquiryId, @RequestBody Offer offer) {
        log.info("POST /api/enquiries/{}/offers - Creating offer", enquiryId);
        Enquiry enquiry = enquiryRepository.findById(enquiryId).orElse(null);
        if (enquiry == null) {
            return ResponseEntity.notFound().build();
        }

        offer.setId(null);
        offer.setEnquiry(enquiry);

        if (offer.getSequenceNo() == null) {
            long seq = offerRepository.countByEnquiryId(enquiryId) + 1;
            offer.setSequenceNo((int) seq);
        }

        if (offer.getIsLatest() == null) {
            offer.setIsLatest(true);
        }

        if (Boolean.TRUE.equals(offer.getIsLatest())) {
            List<Offer> existing = offerRepository.findByEnquiryId(enquiryId);
            for (Offer ex : existing) {
                if (Boolean.TRUE.equals(ex.getIsLatest())) {
                    ex.setIsLatest(false);
                }
            }
            offerRepository.saveAll(existing);
        }

        Offer saved = offerRepository.save(offer);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    /**
     * PUT /api/offers/{offerId} - Update offer
     */
    @PutMapping("/offers/{offerId}")
    public ResponseEntity<Offer> updateOffer(@PathVariable Long offerId, @RequestBody Offer offer) {
        log.info("PUT /api/offers/{} - Updating offer", offerId);
        return offerRepository.findById(offerId)
            .map(existing -> {
                existing.setOfferType(offer.getOfferType());
                existing.setSequenceNo(offer.getSequenceNo());
                existing.setIsLatest(offer.getIsLatest());
                existing.setSentDate(offer.getSentDate());
                existing.setSentDateRawText(offer.getSentDateRawText());
                existing.setPrice(offer.getPrice());
                existing.setPriceText(offer.getPriceText());
                existing.setIsRejectedPrice(offer.getIsRejectedPrice());
                return ResponseEntity.ok(offerRepository.save(existing));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    /**
     * DELETE /api/offers/{offerId} - Delete offer
     */
    @DeleteMapping("/offers/{offerId}")
    public ResponseEntity<Void> deleteOffer(@PathVariable Long offerId) {
        log.info("DELETE /api/offers/{} - Deleting offer", offerId);
        if (!offerRepository.existsById(offerId)) {
            return ResponseEntity.notFound().build();
        }
        offerRepository.deleteById(offerId);
        return ResponseEntity.noContent().build();
    }
}
