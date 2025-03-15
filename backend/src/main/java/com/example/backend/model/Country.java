package com.example.backend.model;

import org.yaml.snakeyaml.util.Tuple;
import java.util.List;

public record Country(String name, String code, List<List<List<List<Double>>>> multipolygon) {
}
