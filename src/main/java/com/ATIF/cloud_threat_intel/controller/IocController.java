package com.ATIF.cloud_threat_intel.controller;

import com.ATIF.cloud_threat_intel.entity.Ioc;
import com.ATIF.cloud_threat_intel.repository.IocRepository;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/iocs")
public class IocController {

    private final IocRepository iocRepository;

    public IocController(IocRepository iocRepository) {
        this.iocRepository = iocRepository;
    }

    @GetMapping
    public List<Ioc> getAllIocs() {
        return iocRepository.findAll();
    }

    @PostMapping
    public Ioc createIoc(@RequestBody Ioc ioc) {
        return iocRepository.save(ioc);
    }

    @GetMapping("/type/{type}")
    public List<Ioc> getByType(@PathVariable String type) {
        return iocRepository.findByType(type);
    }
}