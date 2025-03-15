package com.example.backend;


import com.example.backend.model.Country;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.locationtech.proj4j.BasicCoordinateTransform;
import org.locationtech.proj4j.CRSFactory;
import org.locationtech.proj4j.CoordinateReferenceSystem;
import org.locationtech.proj4j.ProjCoordinate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.core.io.ClassPathResource;
import org.springframework.web.reactive.function.client.WebClient;
import org.yaml.snakeyaml.util.Tuple;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@SpringBootApplication
public class BackendApplication {

	private static Logger logger = LoggerFactory.getLogger(BackendApplication.class);

	public static void main(String[] args) {
		SpringApplication.run(BackendApplication.class, args);
	}

	@Bean
	public List<Country> countries() {
		return new ArrayList<Country>(); // Initialize with empty data
	}

	@Bean
	public WebClient webClient() {
		return WebClient.builder().baseUrl("https://hellosalut.stefanbohacek.dev").build();
	}

	@Bean
	public CommandLineRunner loadFileData(List<Country> countries) {
		return args -> {
			// Load file from resources
			Path filePath = new ClassPathResource("country_code.json").getFile().toPath();
			String jsonContent = Files.readString(filePath);

			// Parse JSON
			ObjectMapper objectMapper = new ObjectMapper();
			List<JsonNode> countryNodes = objectMapper.readValue(jsonContent, new TypeReference<>() {
			});

			for (JsonNode node : countryNodes) {
				String name = node.get("name").asText();
				String code = node.get("code").asText();
				String wkt = node.get("wkt").asText();

				// Convert WKT MULTIPOLYGON to List<List<List<List<Double>>>
				List<List<List<List<Double>>>> multipolygon = parseMultiPolygon(wkt);

				countries.add(new Country(name, code, multipolygon));
			}
			logger.info(countries.get(1).toString());
		};
	}

	private static List<List<List<List<Double>>>> parseMultiPolygon(String wkt) {
		List<List<List<List<Double>>>> multiPolygon = new ArrayList<>();

		CRSFactory crsFactory = new CRSFactory();

		String webMercator = "+proj=merc +lon_0=0 +k=1 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs";
		CoordinateReferenceSystem sourceCRS = crsFactory.createFromParameters("EPSG:31370", webMercator);


		// Define the target CRS (WGS84 - EPSG:4326)
		String wgs84 = "+proj=longlat +datum=WGS84 +no_defs";
		CoordinateReferenceSystem targetCRS = crsFactory.createFromParameters("WGS84",wgs84);

		// Create a transformation
		BasicCoordinateTransform transform = new BasicCoordinateTransform(sourceCRS, targetCRS);

		// Extract polygons from the MULTIPOLYGON
		Pattern polygonPattern = Pattern.compile("\\(\\((.*?)\\)\\)");
		Matcher polygonMatcher = polygonPattern.matcher(wkt);

		while (polygonMatcher.find()) {
			String polygonText = polygonMatcher.group(1);

			List<List<List<Double>>> polygon = new ArrayList<>();
			String[] rings = polygonText.split("\\),\\("); // Separate outer ring and holes

			for (String ringText : rings) {
				List<List<Double>> ring = new ArrayList<>();
				Pattern coordPattern = Pattern.compile("(\\d+\\.\\d+)\\s+(\\d+\\.\\d+)");
				Matcher coordMatcher = coordPattern.matcher(ringText);

				while (coordMatcher.find()) {
					Double x = Double.parseDouble(coordMatcher.group(1));
					Double y = Double.parseDouble(coordMatcher.group(2));
					ProjCoordinate srcCoord = new ProjCoordinate(x, y);
					ProjCoordinate destCoord = new ProjCoordinate();
					transform.transform(srcCoord, destCoord);
					ring.add(List.of(new Double[]{destCoord.x, destCoord.y}));
				}

				polygon.add(ring);
			}

			multiPolygon.add(polygon);
		}

		return multiPolygon;
	}
}