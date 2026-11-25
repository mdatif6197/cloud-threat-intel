
package com.ATIF.cloud_threat_intel.controller;

import com.ATIF.cloud_threat_intel.entity.Ioc;
import com.ATIF.cloud_threat_intel.repository.IocRepository;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.ATIF.cloud_threat_intel.service.IocIngestionService;
import com.ATIF.cloud_threat_intel.service.OtxClient;

@CrossOrigin(origins = {
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5176"
})


@RestController
@RequestMapping("/api/iocs")

public class IocController {

    private final IocRepository iocRepository;
private final IocIngestionService iocIngestionService;
private final OtxClient otxClient;

    public IocController(
        IocRepository iocRepository,
        IocIngestionService iocIngestionService,
        OtxClient otxClient) {

    this.iocRepository = iocRepository;
    this.iocIngestionService = iocIngestionService;
    this.otxClient = otxClient;
}
   
    // Get all IOCs
    @GetMapping
    public List<Ioc> getAllIocs() {
        return iocRepository.findAll();
    }

    // Get IOC by ID
    @GetMapping("/{id}")
    public ResponseEntity<Ioc> getIocById(@PathVariable Long id) {
        return iocRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Create IOC
    @PostMapping
    public ResponseEntity<?> createIoc(@Valid @RequestBody Ioc ioc) {

        if (ioc.getValue() == null || ioc.getValue().isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "IOC value is required"));
        }

        if (ioc.getType() == null ||
                !List.of("IP", "DOMAIN", "URL", "HASH")
                        .contains(ioc.getType().toUpperCase())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error",
                            "Type must be IP, DOMAIN, URL or HASH"));
        }

        if (ioc.getRiskScore() != null &&
                (ioc.getRiskScore() < 0 || ioc.getRiskScore() > 100)) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error",
                            "Risk score must be between 0 and 100"));
        }

        ioc.setType(ioc.getType().toUpperCase());

        Ioc saved = iocRepository.save(ioc);

        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }


// Ingest IOC
@PostMapping("/ingest")
public ResponseEntity<?> ingestIoc(@RequestBody Ioc ioc) {

    try {
        boolean created = iocIngestionService.ingestIoc(
                ioc.getValue(),
                ioc.getType(),
                ioc.getSource()
        );

        if (!created) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "IOC already exists"));
        }

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("message", "IOC ingested successfully"));

    } catch (IllegalArgumentException e) {
        return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
    }
}


    // Test AlienVault OTX connection
    @GetMapping("/otx/test")
    public ResponseEntity<?> testOtxConnection() {
        try {
            String response = otxClient.getMySubscribedPulses();
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(Map.of(
                            "error", "Failed to connect to AlienVault OTX",
                            "details", e.getMessage()
                    ));
        }
    }



    // Filter by type
    @GetMapping("/type/{type}")
    public List<Ioc> getByType(@PathVariable String type) {
        return iocRepository.findByType(type.toUpperCase());
    }

    // Search IOC by value
    @GetMapping("/search")
    public List<Ioc> searchIocs(@RequestParam String value) {
        return iocRepository.findByValueContainingIgnoreCase(value);
    }

    // Update IOC risk score
@PatchMapping("/{id}/risk-score")
public ResponseEntity<?> updateRiskScore(
        
    @PathVariable Long id,
        @RequestParam Integer score) {

    if (score < 0 || score > 100) {
        return ResponseEntity.badRequest()
                .body(Map.of(
                        "error",
                        "Risk score must be between 0 and 100"
                ));
    }

    return iocRepository.findById(id)
            .map(ioc -> {
                ioc.setRiskScore(score);

                Ioc updated = iocRepository.save(ioc);

                return ResponseEntity.ok(updated);
            })
            .orElse(ResponseEntity.notFound().build());
}

    // Delete IOC
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteIoc(@PathVariable Long id) {

        if (!iocRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        iocRepository.deleteById(id);

        return ResponseEntity.noContent().build();
    }

    // Dashboard statistics
    @GetMapping("/stats")
    public Map<String, Object> getStats() {

        List<Ioc> allIocs = iocRepository.findAll();

        Map<String, Object> stats = new HashMap<>();

        stats.put("totalIocs", allIocs.size());
        stats.put("totalIPs", iocRepository.countByType("IP"));
        stats.put("totalDomains", iocRepository.countByType("DOMAIN"));
        stats.put("totalURLs", iocRepository.countByType("URL"));
        stats.put("totalHashes", iocRepository.countByType("HASH"));

        long highRisk = allIocs.stream()
                .filter(i -> i.getRiskScore() != null &&
                        i.getRiskScore() >= 70)
                .count();

        stats.put("highRiskIocs", highRisk);

        return stats;
    }
}
