package com.ATIF.cloud_threat_intel.repository;

import com.ATIF.cloud_threat_intel.entity.Ioc;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface IocRepository extends JpaRepository<Ioc, Long> {
    List<Ioc> findByType(String type);
    List<Ioc> findBySource(String source);
}