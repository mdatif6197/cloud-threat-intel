package com.ATIF.cloud_threat_intel.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "iocs")
public class Ioc {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String value;
    private String type;
    private String source;
    private Integer riskScore;

    private LocalDateTime firstSeen;
    private LocalDateTime lastUpdated;

    public Ioc() {}

    public Ioc(String value, String type, String source) {
        this.value = value;
        this.type = type;
        this.source = source;
        this.firstSeen = LocalDateTime.now();
        this.lastUpdated = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getValue() { return value; }
    public void setValue(String value) { this.value = value; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
    public Integer getRiskScore() { return riskScore; }
    public void setRiskScore(Integer riskScore) { this.riskScore = riskScore; }
    public LocalDateTime getFirstSeen() { return firstSeen; }
    public void setFirstSeen(LocalDateTime firstSeen) { this.firstSeen = firstSeen; }
    public LocalDateTime getLastUpdated() { return lastUpdated; }
    public void setLastUpdated(LocalDateTime lastUpdated) { this.lastUpdated = lastUpdated; }

    @PrePersist
    protected void onCreate() {
        this.firstSeen = LocalDateTime.now();
        this.lastUpdated = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.lastUpdated = LocalDateTime.now();
    }
    @Transient
public String getRiskLevel() {
    if (riskScore == null) {
        return "UNASSESSED";
    }

    if (riskScore >= 80) {
        return "CRITICAL";
    } else if (riskScore >= 60) {
        return "HIGH";
    } else if (riskScore >= 30) {
        return "MEDIUM";
    } else {
        return "LOW";
    }
}
}