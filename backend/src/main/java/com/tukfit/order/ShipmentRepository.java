package com.tukfit.order;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ShipmentRepository extends JpaRepository<Shipment, Long> {

	Optional<Shipment> findByOrderId(Long orderId);

	List<Shipment> findByOrderIdIn(Collection<Long> orderIds);
}
