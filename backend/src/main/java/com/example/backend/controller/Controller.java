package com.example.backend.controller;

import com.example.backend.model.Country;
import com.example.backend.model.HelloResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;

import java.time.Duration;
import java.util.List;

@RestController
public class Controller {

    private static Logger logger = LoggerFactory.getLogger(Controller.class);

    @Autowired
    private List<Country> countryList;

    @Autowired
    private WebClient webClient;

    @CrossOrigin("http://localhost:4200")
    @GetMapping("get-countries")
    public List<Country> getCountryList(){
        return  countryList;
    }

    // GET endpoint to translate hello for different countries data
    @CrossOrigin("http://localhost:4200")
    @GetMapping("/translate-hello")
    public ResponseEntity<String> translateHello(@RequestParam String cc) {
        try {
            // Block the Mono to get the result synchronously
            HelloResponse result = getHelloTranslation(cc).block();
            return ResponseEntity.ok(result.hello());

        } catch (Exception e) {
            // Catch any exceptions and return a 500 status
            logger.info("Error...");
            logger.info(String.valueOf(e));
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Service method to fetch country hello data from external API
    private Mono<HelloResponse> getHelloTranslation(String countryCode) {
        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .queryParam("cc", countryCode)
                        .build())
                .retrieve()
                .bodyToMono(HelloResponse.class)
                .retryWhen(Retry.fixedDelay(3, Duration.ofSeconds(2)));
    }


}
