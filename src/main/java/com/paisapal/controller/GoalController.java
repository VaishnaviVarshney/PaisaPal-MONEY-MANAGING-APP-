package com.paisapal.controller;

import com.paisapal.model.Goal;
import com.paisapal.repository.GoalRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;

@RestController
@RequestMapping("/api/goals")
public class GoalController {
    private final GoalRepository repo;
    public GoalController(GoalRepository repo) { this.repo = repo; }

    @GetMapping public List<Goal> all() { return repo.findAll(); }

    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public Goal create(@Valid @RequestBody Goal goal) {
        goal.setId(null);
        if (goal.getSavedAmount() == null) goal.setSavedAmount(java.math.BigDecimal.ZERO);
        return repo.save(goal);
    }

    @PutMapping("/{id}")
    public Goal update(@PathVariable Long id, @Valid @RequestBody Goal input) {
        Goal old = repo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        input.setId(old.getId());
        return repo.save(input);
    }

    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        if (!repo.existsById(id)) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        repo.deleteById(id);
    }
}
