package com.paisapal.controller;

import com.paisapal.model.Transaction;
import com.paisapal.repository.TransactionRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {
    private final TransactionRepository repo;
    public TransactionController(TransactionRepository repo) { this.repo = repo; }

    @GetMapping
    public List<Transaction> all(@RequestParam(required=false) String type,
                                 @RequestParam(required=false) String category,
                                 @RequestParam(required=false) String search) {
        return repo.findAllByOrderByDateDescIdDesc().stream()
            .filter(t -> type == null || type.isBlank() || t.getType().equalsIgnoreCase(type))
            .filter(t -> category == null || category.isBlank() || t.getCategory().equalsIgnoreCase(category))
            .filter(t -> search == null || search.isBlank() ||
                t.getDescription().toLowerCase(Locale.ROOT).contains(search.toLowerCase(Locale.ROOT)) ||
                t.getCategory().toLowerCase(Locale.ROOT).contains(search.toLowerCase(Locale.ROOT)))
            .collect(Collectors.toList());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Transaction create(@Valid @RequestBody Transaction transaction) {
        validateType(transaction);
        transaction.setId(null);
        return repo.save(transaction);
    }

    @PutMapping("/{id}")
    public Transaction update(@PathVariable Long id, @Valid @RequestBody Transaction input) {
        Transaction old = repo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        validateType(input);
        input.setId(old.getId());
        return repo.save(input);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        if (!repo.existsById(id)) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        repo.deleteById(id);
    }

    private void validateType(Transaction t) {
        if (!"INCOME".equalsIgnoreCase(t.getType()) && !"EXPENSE".equalsIgnoreCase(t.getType()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Type must be INCOME or EXPENSE");
        t.setType(t.getType().toUpperCase(Locale.ROOT));
    }
}
