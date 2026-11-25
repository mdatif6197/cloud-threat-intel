
package com.ATIF.cloud_threat_intel.service;

import com.ATIF.cloud_threat_intel.entity.Ioc;
import com.ATIF.cloud_threat_intel.repository.IocRepository;
import org.springframework.stereotype.Service;

@Service
public class IocIngestionService {

    private final IocRepository iocRepository;

    public IocIngestionService(IocRepository iocRepository) {
        this.iocRepository = iocRepository;
    }

    public boolean ingestIoc(String value, String type, String source) {

        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("IOC value cannot be empty");
        }

        if (type == null || type.isBlank()) {
            throw new IllegalArgumentException("IOC type cannot be empty");
        }

        if (source == null || source.isBlank()) {
            throw new IllegalArgumentException("IOC source cannot be empty");
        }

        String normalizedValue = value.trim();
        String normalizedType = type.trim().toUpperCase();
        String normalizedSource = source.trim();

        boolean alreadyExists =
                iocRepository.existsByValueAndType(
                        normalizedValue, normalizedType);

        if (alreadyExists) {
            return false;
        }

        Ioc ioc = new Ioc(
                normalizedValue,
                normalizedType,
                normalizedSource
        );

        iocRepository.save(ioc);

        return true;
    }
}
