package com.paisapal.controller;

import com.paisapal.model.Transaction;
import com.paisapal.repository.TransactionRepository;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class DashboardController {
    private final TransactionRepository transactions;
    private BigDecimal monthlyLimit = new BigDecimal("10000");
    public DashboardController(TransactionRepository transactions) { this.transactions = transactions; }

    @GetMapping("/dashboard")
    public Map<String, Object> dashboard() {
        List<Transaction> all = transactions.findAll();
        BigDecimal income = sum(all, "INCOME");
        BigDecimal expenses = sum(all, "EXPENSE");
        BigDecimal savings = income.subtract(expenses);
        Map<String, BigDecimal> categories = all.stream()
            .filter(t -> "EXPENSE".equalsIgnoreCase(t.getType()))
            .collect(Collectors.groupingBy(Transaction::getCategory,
                Collectors.reducing(BigDecimal.ZERO, Transaction::getAmount, BigDecimal::add)));
        LocalDate now = LocalDate.now();
        List<Map<String,Object>> months = new ArrayList<>();
        for (int i=5; i>=0; i--) {
            LocalDate m = now.minusMonths(i);
            BigDecimal mi = BigDecimal.ZERO, me = BigDecimal.ZERO;
            for (Transaction t : all) if (t.getDate().getYear()==m.getYear() && t.getDate().getMonth()==m.getMonth()) {
                if ("INCOME".equalsIgnoreCase(t.getType())) mi=mi.add(t.getAmount()); else me=me.add(t.getAmount());
            }
            Map<String,Object> item = new LinkedHashMap<>();
            item.put("month", m.getMonth().toString().substring(0,3)); item.put("income",mi); item.put("expense",me); months.add(item);
        }
        Map<String,Object> result = new LinkedHashMap<>();
        result.put("balance", savings); result.put("income",income); result.put("expenses",expenses);
        result.put("savings",savings); result.put("categories",categories); result.put("monthlyTrend",months);
        result.put("monthlyLimit",monthlyLimit);
        result.put("budgetUsedPercent", monthlyLimit.signum()==0 ? 0 : expenses.multiply(new BigDecimal("100")).divide(monthlyLimit, 0, java.math.RoundingMode.HALF_UP).intValue());
        result.put("moneyPersonality", expenses.compareTo(income.multiply(new BigDecimal("0.7"))) > 0 ? "Treat Yourself, Then Reset" : "The Balanced Dreamer");
        return result;
    }

    @GetMapping("/budget")
    public Map<String,BigDecimal> getBudget() { return Map.of("monthlyLimit", monthlyLimit); }

    @PutMapping("/budget")
    public Map<String,BigDecimal> setBudget(@RequestBody Map<String,BigDecimal> body) {
        BigDecimal limit = body.get("monthlyLimit");
        if (limit == null || limit.signum() <= 0) throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST, "Monthly limit must be positive");
        monthlyLimit = limit;
        return getBudget();
    }

    private BigDecimal sum(List<Transaction> list, String type) {
        return list.stream().filter(t -> type.equalsIgnoreCase(t.getType()))
            .map(Transaction::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
