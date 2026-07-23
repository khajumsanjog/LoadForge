package engine

import (
	"loadforge/pkg/models"
)

// CalculateTargetVUs determines active virtual users at elapsed time t for a given LoadProfile
func CalculateTargetVUs(profile models.LoadProfile, elapsedSec int) int {
	duration := profile.DurationSeconds
	if duration <= 0 {
		duration = 60
	}

	switch profile.Pattern {
	case models.PatternConstant:
		if profile.TargetUsers > 0 {
			return profile.TargetUsers
		}
		return 10

	case models.PatternRampUp:
		target := profile.TargetUsers
		if target == 0 {
			target = 100
		}
		rampSec := profile.RampUpSeconds
		if rampSec <= 0 {
			rampSec = duration
		}
		if elapsedSec >= rampSec {
			return target
		}
		progress := float64(elapsedSec) / float64(rampSec)
		initial := profile.InitialUsers
		return initial + int(progress*float64(target-initial))

	case models.PatternRampDown:
		initial := profile.InitialUsers
		if initial == 0 {
			initial = 100
		}
		target := profile.TargetUsers
		progress := float64(elapsedSec) / float64(duration)
		if progress >= 1.0 {
			return target
		}
		return initial - int(progress*float64(initial-target))

	case models.PatternSpike:
		base := profile.InitialUsers
		if base == 0 {
			base = 20
		}
		spike := profile.SpikeUsers
		if spike == 0 {
			spike = 500
		}
		spikeStart := duration / 3
		spikeEnd := spikeStart + profile.SpikeDurationSec
		if profile.SpikeDurationSec == 0 {
			spikeEnd = spikeStart + 10
		}

		if elapsedSec >= spikeStart && elapsedSec <= spikeEnd {
			return spike
		}
		return base

	case models.PatternStress:
		// Stepwise escalation every 10 seconds
		stepInterval := 10
		stepCount := elapsedSec / stepInterval
		initial := profile.InitialUsers
		if initial == 0 {
			initial = 10
		}
		increment := 25
		return initial + (stepCount * increment)

	case models.PatternSoak:
		target := profile.TargetUsers
		if target == 0 {
			target = 50
		}
		return target

	case models.PatternBreakpoint:
		// Steadily increase by 50 VUs every 5 seconds until limit/breakpoint trigger
		step := elapsedSec / 5
		initial := profile.InitialUsers
		if initial == 0 {
			initial = 10
		}
		return initial + (step * 50)

	case models.PatternCustom:
		if len(profile.Stages) == 0 {
			return profile.TargetUsers
		}
		accumulatedSec := 0
		for _, stage := range profile.Stages {
			accumulatedSec += stage.DurationSeconds
			if elapsedSec <= accumulatedSec {
				return stage.TargetUsers
			}
		}
		return profile.Stages[len(profile.Stages)-1].TargetUsers
	}

	return 10
}
