package com.paisapal.config;

import com.paisapal.model.Goal;
import com.paisapal.model.Transaction;
import com.paisapal.repository.GoalRepository;
import com.paisapal.repository.TransactionRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import java.math.BigDecimal;
import java.time.LocalDate;

@Configuration
public class DemoData {
    @Bean
    CommandLineRunner seed(TransactionRepository txRepo, GoalRepository goalRepo) {
        return args -> {
            if (txRepo.count() == 0) {
                add(txRepo, "Salary", "Salary", "INCOME", "20000", 2);
                add(txRepo, "Zomato", "Food", "EXPENSE", "420", 1);
                add(txRepo, "Amazon", "Shopping", "EXPENSE", "1250", 3);
                add(txRepo, "Metro Card", "Travel", "EXPENSE", "280", 5);
                add(txRepo, "Online Course", "Education", "EXPENSE", "1800", 7);
                add(txRepo, "Coffee", "Food", "EXPENSE", "180", 9);
            }
            if (goalRepo.count() == 0) {
                goal(goalRepo, "New Sneakers", "5000", "3500", "👟");
                goal(goalRepo, "Trip to Manali", "15000", "8000", "🏔️");
                goal(goalRepo, "Emergency Fund", "20000", "4450", "🐷");
            }
        };
    }
    private void add(TransactionRepository repo, String desc, String category, String type, String amount, int daysAgo) {
        Transaction t = new Transaction();
        t.setDescription(desc); t.setCategory(category); t.setType(type);
        t.setAmount(new BigDecimal(amount)); t.setDate(LocalDate.now().minusDays(daysAgo));
        repo.save(t);
    }
    private void goal(GoalRepository repo, String name, String target, String saved, String emoji) {
        Goal g = new Goal(); g.setName(name); g.setTargetAmount(new BigDecimal(target));
        g.setSavedAmount(new BigDecimal(saved)); g.setEmoji(emoji); repo.save(g);
    }
}
