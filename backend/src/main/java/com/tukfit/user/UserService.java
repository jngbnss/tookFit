package com.tukfit.user;

import java.util.List;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tukfit.auth.TokenService;
import com.tukfit.global.error.ApiException;
import com.tukfit.global.error.ErrorCode;
import com.tukfit.order.OrderRepository;
import com.tukfit.order.OrderStatus;
import com.tukfit.user.UserDtos.AddressDto;
import com.tukfit.user.UserDtos.AddressRequest;
import com.tukfit.user.UserDtos.ChangePasswordRequest;
import com.tukfit.user.UserDtos.Me;
import com.tukfit.user.UserDtos.UpdateMeRequest;

@Service
public class UserService {

	private static final List<OrderStatus> IN_PROGRESS = List.of(OrderStatus.PAID, OrderStatus.PREPARING,
			OrderStatus.SHIPPED);

	private final UserRepository users;
	private final AddressRepository addresses;
	private final OrderRepository orders;
	private final PasswordEncoder passwordEncoder;
	private final TokenService tokens;

	public UserService(UserRepository users, AddressRepository addresses, OrderRepository orders,
			PasswordEncoder passwordEncoder, TokenService tokens) {
		this.users = users;
		this.addresses = addresses;
		this.orders = orders;
		this.passwordEncoder = passwordEncoder;
		this.tokens = tokens;
	}

	@Transactional(readOnly = true)
	public User get(Long userId) {
		return users.findById(userId).filter(User::isActive)
				.orElseThrow(() -> new ApiException(ErrorCode.UNAUTHORIZED));
	}

	@Transactional(readOnly = true)
	public Me me(Long userId) {
		return Me.of(get(userId));
	}

	@Transactional
	public Me update(Long userId, UpdateMeRequest request) {
		User user = get(userId);
		user.updateProfile(request.name(), request.phone(), request.marketingAgreed());
		return Me.of(user);
	}

	@Transactional
	public void changePassword(Long userId, ChangePasswordRequest request) {
		User user = get(userId);
		if (user.getPasswordHash() != null && (request.currentPassword() == null
				|| !passwordEncoder.matches(request.currentPassword(), user.getPasswordHash()))) {
			throw new ApiException(ErrorCode.PASSWORD_MISMATCH);
		}
		user.changePassword(passwordEncoder.encode(request.newPassword()));
	}

	@Transactional
	public void withdraw(Long userId) {
		User user = get(userId);
		if (orders.existsByUserIdAndStatusIn(userId, IN_PROGRESS)) {
			throw new ApiException(ErrorCode.WITHDRAW_NOT_ALLOWED);
		}
		tokens.revokeAll(userId);
		addresses.deleteByUserId(userId);
		user.withdraw();
	}

	@Transactional(readOnly = true)
	public List<AddressDto> addresses(Long userId) {
		return addresses.findByUserIdOrderByIsDefaultDescIdDesc(userId).stream().map(AddressDto::of).toList();
	}

	@Transactional
	public AddressDto addAddress(Long userId, AddressRequest request) {
		Address address = new Address(userId);
		apply(address, request);
		boolean first = addresses.countByUserId(userId) == 0;
		address = addresses.save(address);
		setDefaultIfNeeded(address, request.isDefault() || first);
		return AddressDto.of(address);
	}

	@Transactional
	public AddressDto updateAddress(Long userId, Long id, AddressRequest request) {
		Address address = addresses.findByIdAndUserId(id, userId)
				.orElseThrow(() -> new ApiException(ErrorCode.ADDRESS_NOT_FOUND));
		apply(address, request);
		setDefaultIfNeeded(address, request.isDefault());
		return AddressDto.of(address);
	}

	@Transactional
	public void deleteAddress(Long userId, Long id) {
		Address address = addresses.findByIdAndUserId(id, userId)
				.orElseThrow(() -> new ApiException(ErrorCode.ADDRESS_NOT_FOUND));
		addresses.delete(address);
	}

	private void apply(Address address, AddressRequest r) {
		address.update(blankToNull(r.label()), r.recipient(), r.phone(), r.postalCode(), r.address1(),
				blankToNull(r.address2()));
	}

	private void setDefaultIfNeeded(Address address, boolean makeDefault) {
		if (makeDefault) {
			addresses.clearDefault(address.getUserId(), address.getId());
			address.markDefault(true);
		}
	}

	private static String blankToNull(String value) {
		return value == null || value.isBlank() ? null : value;
	}
}
