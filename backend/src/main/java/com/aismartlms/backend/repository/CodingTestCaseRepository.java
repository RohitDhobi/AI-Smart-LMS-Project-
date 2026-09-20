package com.aismartlms.backend.repository;

import com.aismartlms.backend.entity.CodingProblem;
import com.aismartlms.backend.entity.CodingTestCase;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CodingTestCaseRepository extends JpaRepository<CodingTestCase, Long> {

    List<CodingTestCase> findByProblemOrderByOrderIndexAsc(CodingProblem problem);

    List<CodingTestCase> findByProblemIdOrderByOrderIndexAsc(Long problemId);

    List<CodingTestCase> findByProblemAndIsSampleTrueOrderByOrderIndexAsc(CodingProblem problem);

    List<CodingTestCase> findByProblemIdAndIsSampleTrueOrderByOrderIndexAsc(Long problemId);

    void deleteByProblem(CodingProblem problem);
}
