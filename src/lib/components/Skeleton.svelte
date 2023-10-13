<div class="box" />

<style>
	@keyframes gradient-shift {
		0% {
			background-position: 0% 0%;
		}
		100% {
			background-position: 700% 0%;
		}
	}

	.box {
		--color: rgb(226, 226, 226);
		--color-light: rgba(226, 226, 226, 0.1);
		background: linear-gradient(
			to right,
			var(--color) 15%,
			var(--color-light) 50%,
			var(--color) 85%
		);
		background-size: 700% 100%;
		height: 20px;
		width: 100%;
		margin: 10px 0;
		animation: gradient-shift 12s linear infinite;
		border-radius: 8px;
	}
</style>
