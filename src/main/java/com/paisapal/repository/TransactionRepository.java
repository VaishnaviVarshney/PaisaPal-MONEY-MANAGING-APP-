package com.paisapal.repository;

import com.paisapal.model.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    List<Transaction> findAllByOrderByDateDescIdDesc();
    List<Transaction> findByDateBetweenOrderByDateDesc(LocalDate start, LocalDate end);
}
