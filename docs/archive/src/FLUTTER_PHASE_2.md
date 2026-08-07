# 🎮 PHASE 2: ENGAGEMENT FEATURES - FLUTTER IMPLEMENTATION

## Complete Guide for Gamification & Retention Features

---

## 📦 NEW FEATURES OVERVIEW

### **Phase 2 Additions:**
1. ✅ **Podium Visual** - Top 3 performers on home screen
2. ✅ **Multiple Leaderboards** - Global, Regional, Team, All-Time
3. ✅ **Achievement Badges** - 15+ unlockable achievements
4. ✅ **Daily Challenges** - Engagement missions with bonus rewards
5. ✅ **Streak Counter** - Consecutive day tracking with fire emoji
6. ✅ **Enhanced Profile** - Badge showcase, detailed stats

---

## 🏆 SCREEN ENHANCEMENT: HOME WITH PODIUM

### File: `lib/features/home/widgets/podium_widget.dart`

```dart
import 'package:flutter/material.dart';
import '../../../core/constants/colors.dart';
import '../../../core/constants/typography.dart';
import '../../../core/constants/spacing.dart';

class PodiumWidget extends StatelessWidget {
  final List<LeaderboardEntry> topThree;

  const PodiumWidget({
    Key? key,
    required this.topThree,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    if (topThree.length < 3) {
      return const SizedBox.shrink();
    }

    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [AppColors.gray50, Colors.white],
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
        ),
        borderRadius: BorderRadius.circular(AppSpacing.cardBorderRadius),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Top 3 This Week',
            style: AppTypography.titleLarge,
          ),
          const SizedBox(height: AppSpacing.lg),
          
          // Podium Layout
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              // 2nd Place
              _buildPodiumPosition(
                entry: topThree[1],
                rank: 2,
                height: 100,
                medalColor: AppColors.gray400,
              ),
              
              const SizedBox(width: AppSpacing.sm),
              
              // 1st Place (Elevated)
              _buildPodiumPosition(
                entry: topThree[0],
                rank: 1,
                height: 130,
                medalColor: const Color(0xFFFFD700), // Gold
                isWinner: true,
              ),
              
              const SizedBox(width: AppSpacing.sm),
              
              // 3rd Place
              _buildPodiumPosition(
                entry: topThree[2],
                rank: 3,
                height: 80,
                medalColor: const Color(0xFFCD7F32), // Bronze
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPodiumPosition({
    required LeaderboardEntry entry,
    required int rank,
    required double height,
    required Color medalColor,
    bool isWinner = false,
  }) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Avatar
        Container(
          width: isWinner ? 64 : 56,
          height: isWinner ? 64 : 56,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(
              color: medalColor,
              width: 3,
            ),
            image: entry.avatarUrl != null
                ? DecorationImage(
                    image: NetworkImage(entry.avatarUrl!),
                    fit: BoxFit.cover,
                  )
                : null,
            color: AppColors.gray200,
          ),
          child: entry.avatarUrl == null
              ? const Icon(Icons.person, color: AppColors.gray500)
              : null,
        ),
        
        const SizedBox(height: AppSpacing.xs),
        
        // Medal
        Text(
          rank == 1 ? '🥇' : rank == 2 ? '🥈' : '🥉',
          style: TextStyle(fontSize: isWinner ? 32 : 28),
        ),
        
        // Name
        SizedBox(
          width: 80,
          child: Text(
            entry.name,
            style: AppTypography.bodySmall.copyWith(
              fontWeight: isWinner ? FontWeight.w600 : FontWeight.w500,
            ),
            textAlign: TextAlign.center,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),
        
        // Points
        Text(
          '${entry.points.toStringAsFixed(0)} pts',
          style: AppTypography.labelSmall.copyWith(
            color: AppColors.airtelRed,
            fontWeight: FontWeight.w600,
          ),
        ),
        
        const SizedBox(height: AppSpacing.sm),
        
        // Podium Base
        Container(
          width: 80,
          height: height,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                medalColor.withOpacity(0.3),
                medalColor.withOpacity(0.1),
              ],
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
            ),
            borderRadius: const BorderRadius.vertical(
              top: Radius.circular(8),
            ),
            border: Border.all(color: medalColor),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                '#$rank',
                style: AppTypography.headlineSmall.copyWith(
                  color: medalColor,
                  fontWeight: FontWeight.w700,
                ),
              ),
              Text(
                '${entry.submissions} missions',
                style: AppTypography.labelSmall.copyWith(
                  color: AppColors.textSecondary,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

// Data Model
class LeaderboardEntry {
  final String id;
  final String name;
  final int points;
  final int submissions;
  final String? avatarUrl;
  final int rank;
  final String region;
  final String team;
  final int streak;

  LeaderboardEntry({
    required this.id,
    required this.name,
    required this.points,
    required this.submissions,
    this.avatarUrl,
    required this.rank,
    required this.region,
    required this.team,
    required this.streak,
  });
}
```

---

## 📊 SCREEN: ENHANCED LEADERBOARD

### File: `lib/features/leaderboard/leaderboard_screen.dart`

```dart
import 'package:flutter/material.dart';
import '../../core/constants/colors.dart';
import '../../core/constants/typography.dart';
import '../../core/constants/spacing.dart';

enum LeaderboardType { global, regional, team, allTime }

class LeaderboardScreen extends StatefulWidget {
  const LeaderboardScreen({Key? key}) : super(key: key);

  @override
  State<LeaderboardScreen> createState() => _LeaderboardScreenState();
}

class _LeaderboardScreenState extends State<LeaderboardScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  LeaderboardType _currentType = LeaderboardType.global;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Leaderboard'),
        bottom: TabBar(
          controller: _tabController,
          onTap: (index) {
            setState(() {
              _currentType = LeaderboardType.values[index];
            });
          },
          tabs: const [
            Tab(text: 'Global'),
            Tab(text: 'Regional'),
            Tab(text: 'Team'),
            Tab(text: 'All-Time'),
          ],
          indicatorColor: AppColors.airtelRed,
          labelColor: AppColors.airtelRed,
          unselectedLabelColor: AppColors.textSecondary,
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildLeaderboardList(LeaderboardType.global),
          _buildLeaderboardList(LeaderboardType.regional),
          _buildLeaderboardList(LeaderboardType.team),
          _buildLeaderboardList(LeaderboardType.allTime),
        ],
      ),
    );
  }

  Widget _buildLeaderboardList(LeaderboardType type) {
    // Mock data - replace with actual data from provider
    final entries = _getMockData(type);
    final currentUser = entries.firstWhere((e) => e.id == 'current-user');

    return RefreshIndicator(
      onRefresh: () async {
        // Implement refresh logic
        await Future.delayed(const Duration(seconds: 1));
      },
      child: ListView.builder(
        padding: const EdgeInsets.all(AppSpacing.screenPadding),
        itemCount: entries.length + 2, // +2 for header and user card
        itemBuilder: (context, index) {
          if (index == 0) {
            // Top 3 Podium
            return Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.lg),
              child: _buildTopThreePodium(entries.take(3).toList()),
            );
          }
          
          if (index == 1) {
            // Current User Card (Sticky)
            return Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.lg),
              child: _buildUserCard(currentUser, highlighted: true),
            );
          }
          
          // Regular entries
          final entry = entries[index - 2];
          return Padding(
            padding: const EdgeInsets.only(bottom: AppSpacing.sm),
            child: _buildUserCard(entry),
          );
        },
      ),
    );
  }

  Widget _buildTopThreePodium(List<LeaderboardEntry> topThree) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [AppColors.gray50, Colors.white],
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
        ),
        borderRadius: BorderRadius.circular(AppSpacing.cardBorderRadius),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          // 2nd place
          _buildPodiumItem(topThree[1], 2, 80, AppColors.gray400),
          const SizedBox(width: AppSpacing.sm),
          // 1st place (elevated)
          _buildPodiumItem(topThree[0], 1, 100, const Color(0xFFFFD700)),
          const SizedBox(width: AppSpacing.sm),
          // 3rd place
          _buildPodiumItem(topThree[2], 3, 60, const Color(0xFFCD7F32)),
        ],
      ),
    );
  }

  Widget _buildPodiumItem(
    LeaderboardEntry entry,
    int rank,
    double height,
    Color color,
  ) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        CircleAvatar(
          radius: rank == 1 ? 28 : 24,
          backgroundColor: color,
          child: CircleAvatar(
            radius: rank == 1 ? 26 : 22,
            backgroundImage: entry.avatarUrl != null
                ? NetworkImage(entry.avatarUrl!)
                : null,
            child: entry.avatarUrl == null
                ? const Icon(Icons.person)
                : null,
          ),
        ),
        const SizedBox(height: AppSpacing.xs),
        Text(
          rank == 1 ? '🥇' : rank == 2 ? '🥈' : '🥉',
          style: TextStyle(fontSize: rank == 1 ? 32 : 24),
        ),
        SizedBox(
          width: 70,
          child: Text(
            entry.name,
            style: AppTypography.bodySmall.copyWith(
              fontWeight: rank == 1 ? FontWeight.w600 : FontWeight.w500,
            ),
            textAlign: TextAlign.center,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),
        Text(
          '${entry.points} pts',
          style: AppTypography.labelSmall.copyWith(
            color: AppColors.airtelRed,
          ),
        ),
        const SizedBox(height: AppSpacing.sm),
        Container(
          width: 70,
          height: height,
          decoration: BoxDecoration(
            color: color.withOpacity(0.2),
            borderRadius: const BorderRadius.vertical(
              top: Radius.circular(8),
            ),
          ),
          child: Center(
            child: Text(
              '#$rank',
              style: AppTypography.titleLarge.copyWith(
                color: color,
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildUserCard(LeaderboardEntry entry, {bool highlighted = false}) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: highlighted ? AppColors.airtelRedBg : AppColors.white,
        borderRadius: BorderRadius.circular(AppSpacing.cardBorderRadius),
        border: Border.all(
          color: highlighted ? AppColors.airtelRed : AppColors.border,
          width: highlighted ? 2 : 1,
        ),
      ),
      child: Row(
        children: [
          // Rank
          SizedBox(
            width: 40,
            child: Text(
              entry.rank <= 3
                  ? (entry.rank == 1
                      ? '🥇'
                      : entry.rank == 2
                          ? '🥈'
                          : '🥉')
                  : '#${entry.rank}',
              style: AppTypography.titleMedium,
              textAlign: TextAlign.center,
            ),
          ),
          
          // Avatar
          CircleAvatar(
            radius: 24,
            backgroundImage: entry.avatarUrl != null
                ? NetworkImage(entry.avatarUrl!)
                : null,
            child: entry.avatarUrl == null
                ? const Icon(Icons.person)
                : null,
          ),
          
          const SizedBox(width: AppSpacing.md),
          
          // Info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  entry.name,
                  style: AppTypography.titleMedium,
                ),
                Text(
                  '${entry.submissions} missions • ${entry.region}',
                  style: AppTypography.bodySmall.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          
          // Points & Streak
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '${entry.points}',
                style: AppTypography.titleMedium.copyWith(
                  color: AppColors.airtelRed,
                  fontWeight: FontWeight.w700,
                ),
              ),
              if (entry.streak > 0)
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text('🔥', style: TextStyle(fontSize: 12)),
                    const SizedBox(width: 2),
                    Text(
                      '${entry.streak}',
                      style: AppTypography.labelSmall.copyWith(
                        color: AppColors.warningAmber,
                      ),
                    ),
                  ],
                ),
            ],
          ),
        ],
      ),
    );
  }

  List<LeaderboardEntry> _getMockData(LeaderboardType type) {
    // Mock data - replace with actual API call
    return [
      LeaderboardEntry(
        id: 'user-1',
        name: 'Sarah Mwangi',
        points: 8540,
        submissions: 52,
        rank: 1,
        region: 'Nairobi',
        team: 'Team Alpha',
        streak: 12,
      ),
      LeaderboardEntry(
        id: 'user-2',
        name: 'John Kamau',
        points: 7230,
        submissions: 48,
        rank: 2,
        region: 'Nairobi',
        team: 'Team Alpha',
        streak: 8,
      ),
      LeaderboardEntry(
        id: 'user-3',
        name: 'Eric Omondi',
        points: 6880,
        submissions: 45,
        rank: 3,
        region: 'Mombasa',
        team: 'Team Beta',
        streak: 15,
      ),
      LeaderboardEntry(
        id: 'current-user',
        name: 'You',
        points: 3450,
        submissions: 23,
        rank: 23,
        region: 'Nairobi',
        team: 'Team Alpha',
        streak: 5,
      ),
      // Add more entries...
    ];
  }
}
```

---

## 🏅 ACHIEVEMENT BADGES SYSTEM

### File: `lib/features/profile/widgets/achievement_badge.dart`

```dart
import 'package:flutter/material.dart';
import '../../../core/constants/colors.dart';
import '../../../core/constants/typography.dart';
import '../../../core/constants/spacing.dart';

enum BadgeRarity { common, rare, epic, legendary }

class AchievementBadge extends StatelessWidget {
  final String icon;
  final String name;
  final String description;
  final BadgeRarity rarity;
  final bool unlocked;
  final int? progress;
  final int? total;

  const AchievementBadge({
    Key? key,
    required this.icon,
    required this.name,
    required this.description,
    required this.rarity,
    this.unlocked = false,
    this.progress,
    this.total,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final rarityColor = _getRarityColor();
    
    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: unlocked ? rarityColor.withOpacity(0.1) : AppColors.gray100,
        borderRadius: BorderRadius.circular(AppSpacing.cardBorderRadius),
        border: Border.all(
          color: unlocked ? rarityColor : AppColors.gray300,
          width: 2,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              // Icon
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: unlocked
                      ? rarityColor.withOpacity(0.2)
                      : AppColors.gray200,
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Text(
                    icon,
                    style: TextStyle(
                      fontSize: 24,
                      color: unlocked ? null : AppColors.gray400,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: AppSpacing.md),
              
              // Name & Rarity
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name,
                      style: AppTypography.titleSmall.copyWith(
                        color: unlocked ? AppColors.textPrimary : AppColors.gray500,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: rarityColor.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        rarity.name.toUpperCase(),
                        style: AppTypography.labelSmall.copyWith(
                          color: rarityColor,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              
              // Locked/Unlocked Indicator
              if (!unlocked)
                const Icon(
                  Icons.lock,
                  color: AppColors.gray400,
                  size: 20,
                ),
            ],
          ),
          
          const SizedBox(height: AppSpacing.sm),
          
          // Description
          Text(
            description,
            style: AppTypography.bodySmall.copyWith(
              color: unlocked ? AppColors.textSecondary : AppColors.gray500,
            ),
          ),
          
          // Progress Bar (if not unlocked)
          if (!unlocked && progress != null && total != null) ...[
            const SizedBox(height: AppSpacing.sm),
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: progress! / total!,
                backgroundColor: AppColors.gray300,
                valueColor: AlwaysStoppedAnimation<Color>(rarityColor),
                minHeight: 6,
              ),
            ),
            const SizedBox(height: AppSpacing.xs),
            Text(
              '$progress / $total',
              style: AppTypography.labelSmall.copyWith(
                color: AppColors.textSecondary,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Color _getRarityColor() {
    switch (rarity) {
      case BadgeRarity.common:
        return AppColors.gray600;
      case BadgeRarity.rare:
        return AppColors.networkBlue;
      case BadgeRarity.epic:
        return const Color(0xFF9333EA); // Purple
      case BadgeRarity.legendary:
        return const Color(0xFFFB923C); // Orange/Gold
    }
  }
}
```

---

## 🎯 DAILY CHALLENGE CARD

### File: `lib/features/home/widgets/challenge_card.dart`

```dart
import 'package:flutter/material.dart';
import '../../../core/constants/colors.dart';
import '../../../core/constants/typography.dart';
import '../../../core/constants/spacing.dart';

class ChallengeCard extends StatelessWidget {
  final String title;
  final String description;
  final int reward;
  final int progress;
  final int total;
  final String timeRemaining;

  const ChallengeCard({
    Key? key,
    required this.title,
    required this.description,
    required this.reward,
    required this.progress,
    required this.total,
    required this.timeRemaining,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final isComplete = progress >= total;
    
    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: isComplete
              ? [AppColors.successGreen.withOpacity(0.1), AppColors.successGreen.withOpacity(0.05)]
              : [AppColors.networkBlue.withOpacity(0.1), AppColors.networkBlue.withOpacity(0.05)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(AppSpacing.cardBorderRadius),
        border: Border.all(
          color: isComplete ? AppColors.successGreen : AppColors.networkBlue,
          width: 2,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              // Icon
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: isComplete
                      ? AppColors.successGreen.withOpacity(0.2)
                      : AppColors.networkBlue.withOpacity(0.2),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  isComplete ? Icons.check_circle : Icons.emoji_events,
                  color: isComplete ? AppColors.successGreen : AppColors.networkBlue,
                ),
              ),
              const SizedBox(width: AppSpacing.md),
              
              // Title & Badge
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: AppTypography.titleMedium,
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.warningAmber.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        'DAILY CHALLENGE',
                        style: AppTypography.labelSmall.copyWith(
                          color: AppColors.warningAmber,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              
              // Reward
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    '+$reward',
                    style: AppTypography.titleLarge.copyWith(
                      color: AppColors.airtelRed,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  Text(
                    'pts',
                    style: AppTypography.labelSmall.copyWith(
                      color: AppColors.airtelRed,
                    ),
                  ),
                ],
              ),
            ],
          ),
          
          const SizedBox(height: AppSpacing.md),
          
          // Description
          Text(
            description,
            style: AppTypography.bodySmall.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
          
          const SizedBox(height: AppSpacing.md),
          
          // Progress
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: LinearProgressIndicator(
                        value: progress / total,
                        backgroundColor: AppColors.gray300,
                        valueColor: AlwaysStoppedAnimation<Color>(
                          isComplete ? AppColors.successGreen : AppColors.networkBlue,
                        ),
                        minHeight: 8,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    Text(
                      isComplete
                          ? '✅ Complete!'
                          : '$progress / $total completed',
                      style: AppTypography.labelSmall.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: AppSpacing.md),
              
              // Time Remaining
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  const Icon(
                    Icons.access_time,
                    size: 16,
                    color: AppColors.textHint,
                  ),
                  Text(
                    timeRemaining,
                    style: AppTypography.labelSmall.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}
```

---

## 🔥 STREAK COUNTER WIDGET

### File: `lib/shared/widgets/streak_counter.dart`

```dart
import 'package:flutter/material.dart';
import '../../core/constants/colors.dart';
import '../../core/constants/typography.dart';
import '../../core/constants/spacing.dart';

class StreakCounter extends StatelessWidget {
  final int currentStreak;
  final int longestStreak;
  final bool showDetails;

  const StreakCounter({
    Key? key,
    required this.currentStreak,
    required this.longestStreak,
    this.showDetails = true,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppColors.warningAmber.withOpacity(0.2),
            AppColors.warningAmber.withOpacity(0.05),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(AppSpacing.cardBorderRadius),
        border: Border.all(color: AppColors.warningAmber),
      ),
      child: Row(
        children: [
          // Fire Icon
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: AppColors.warningAmber.withOpacity(0.3),
              shape: BoxShape.circle,
            ),
            child: const Center(
              child: Text(
                '🔥',
                style: TextStyle(fontSize: 32),
              ),
            ),
          ),
          
          const SizedBox(width: AppSpacing.lg),
          
          // Streak Info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '$currentStreak Day Streak',
                  style: AppTypography.titleLarge.copyWith(
                    color: AppColors.warningAmber,
                  ),
                ),
                if (showDetails) ...[
                  const SizedBox(height: AppSpacing.xs),
                  Text(
                    'Keep submitting daily to maintain your streak!',
                    style: AppTypography.bodySmall.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  Row(
                    children: [
                      const Icon(
                        Icons.emoji_events,
                        size: 16,
                        color: AppColors.textHint,
                      ),
                      const SizedBox(width: AppSpacing.xs),
                      Text(
                        'Longest: $longestStreak days',
                        style: AppTypography.labelSmall.copyWith(
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
```

---

## 📦 UPDATED DEPENDENCIES

Add these to your `pubspec.yaml`:

```yaml
dependencies:
  # Existing dependencies...
  
  # New for Phase 2
  animations: ^2.0.8  # Smooth transitions
  confetti: ^0.7.0    # Celebration effects
  percent_indicator: ^4.2.3  # Progress circles
  badges: ^3.1.2      # Badge overlays
```

---

## ✅ PHASE 2 IMPLEMENTATION CHECKLIST

### **Week 4: Podium & Leaderboards**
- [ ] Implement PodiumWidget component
- [ ] Add multiple leaderboard tabs
- [ ] Create LeaderboardEntry model
- [ ] Fetch top 3 from API
- [ ] Add real-time updates
- [ ] Test on different screen sizes

### **Week 5: Badges & Challenges**
- [ ] Create AchievementBadge widget
- [ ] Implement badge unlock logic
- [ ] Add ChallengeCard widget
- [ ] Create daily challenge system
- [ ] Implement StreakCounter
- [ ] Add celebration animations

### **Testing:**
- [ ] Test podium layout on small screens
- [ ] Verify leaderboard refresh
- [ ] Test badge unlock notifications
- [ ] Validate challenge progress tracking
- [ ] Test streak counter edge cases

---

## 🎨 DESIGN TIPS

### **Animation Guidelines:**
- Badge unlock: Scale + fade animation (300ms)
- Podium entry: Slide up (400ms, staggered)
- Streak update: Pulse animation
- Challenge completion: Confetti effect

### **Performance:**
- Cache leaderboard images
- Lazy load badge list
- Throttle real-time updates (max 1/second)
- Use shimmer loading states

---

**Phase 2 features make the app addictive! Users compete, collect badges, and maintain streaks - driving daily engagement.** 🚀
