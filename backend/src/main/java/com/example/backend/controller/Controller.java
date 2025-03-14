package com.example.backend.controller;

import com.example.backend.model.Country;
import com.example.backend.model.HelloResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;

import java.time.Duration;
import java.util.List;

@RestController
public class Controller {

    @Autowired
    private List<Country> countryList;

    @Autowired
    private WebClient webClient;

    @GetMapping("get-countries")
    public List<Country> getCountryList(){
        return  countryList;
    }

    // GET endpoint to fetch country data
    @GetMapping("/translate-hello")
    public ResponseEntity<String> translateHello(@RequestParam String cc) {
        try {
            // Block the Mono to get the result synchronously
            HelloResponse result = getCountryData(cc).block();  // Wait for the response from the Mono
            return ResponseEntity.ok(result.hello());  // Return the data with a 200 OK status

        } catch (Exception e) {
            // Catch any exceptions and return a 500 status
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Service method to fetch country data from external API
    private Mono<HelloResponse> getCountryData(String countryCode) {
        return webClient.get()
                .uri(uriBuilder -> uriBuilder.path("/country-info")
                        .queryParam("cc", countryCode)
                        .build())
                .retrieve()
                .bodyToMono(HelloResponse.class)  // Convert the response body to a String
                .retryWhen(Retry.fixedDelay(3, Duration.ofSeconds(2)));  // Retry 3 times with a 2 sec delay
    }


}
