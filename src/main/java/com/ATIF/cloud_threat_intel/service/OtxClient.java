
package com.ATIF.cloud_threat_intel.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class OtxClient {

    private final RestClient restClient;

    public OtxClient(
            @Value("${otx.api.key}") String apiKey) {

        this.restClient = RestClient.builder()
                .baseUrl("https://otx.alienvault.com/api/v1")
                .defaultHeader("X-OTX-API-KEY", apiKey)
                .defaultHeader(
                        HttpHeaders.ACCEPT,
                        MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    public String getMySubscribedPulses() {

        return restClient.get()
                .uri("/pulses/subscribed")
                .retrieve()
                .body(String.class);
    }
}
