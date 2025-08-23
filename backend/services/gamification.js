const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class GamificationService {
  constructor() {
    this.db = new sqlite3.Database(path.join(__dirname, '../../database/catemu.db'));
    this.initializeDatabase();
  }

  // Inicializar tablas de gamificación
  initializeDatabase() {
    // Tabla de usuarios y puntos
    this.db.run(`
      CREATE TABLE IF NOT EXISTS user_points (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_identifier TEXT UNIQUE NOT NULL,
        user_name TEXT,
        total_points INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1,
        badges TEXT DEFAULT '[]',
        reports_count INTEGER DEFAULT 0,
        surveys_count INTEGER DEFAULT 0,
        validated_reports INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla de logros/badges
    this.db.run(`
      CREATE TABLE IF NOT EXISTS badges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        icon TEXT,
        points_required INTEGER DEFAULT 0,
        criteria TEXT,
        category TEXT,
        rarity TEXT DEFAULT 'common'
      )
    `);

    // Tabla de actividades que dan puntos
    this.db.run(`
      CREATE TABLE IF NOT EXISTS point_activities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_identifier TEXT NOT NULL,
        activity_type TEXT NOT NULL,
        points_earned INTEGER NOT NULL,
        reference_id TEXT,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla de recompensas
    this.db.run(`
      CREATE TABLE IF NOT EXISTS rewards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        points_cost INTEGER NOT NULL,
        category TEXT,
        available_quantity INTEGER DEFAULT -1,
        image_url TEXT,
        active INTEGER DEFAULT 1
      )
    `);

    // Tabla de canjes de recompensas
    this.db.run(`
      CREATE TABLE IF NOT EXISTS reward_redemptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_identifier TEXT NOT NULL,
        reward_id INTEGER NOT NULL,
        points_spent INTEGER NOT NULL,
        status TEXT DEFAULT 'pending',
        redeemed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        processed_at DATETIME,
        FOREIGN KEY (reward_id) REFERENCES rewards(id)
      )
    `);

    // Insertar badges iniciales
    this.initializeBadges();
    
    // Insertar recompensas iniciales
    this.initializeRewards();
  }

  initializeBadges() {
    const badges = [
      // Badges de inicio
      {
        code: 'first_report',
        name: 'Primer Reporte',
        description: 'Creaste tu primer reporte ciudadano',
        icon: '🎯',
        points_required: 0,
        criteria: 'reports_count >= 1',
        category: 'reportes',
        rarity: 'common'
      },
      {
        code: 'first_survey',
        name: 'Primera Encuesta',
        description: 'Completaste tu primera encuesta',
        icon: '📝',
        points_required: 0,
        criteria: 'surveys_count >= 1',
        category: 'encuestas',
        rarity: 'common'
      },
      
      // Badges de reportes
      {
        code: 'reporter_bronze',
        name: 'Reportero Bronce',
        description: 'Has creado 5 reportes',
        icon: '🥉',
        points_required: 50,
        criteria: 'reports_count >= 5',
        category: 'reportes',
        rarity: 'common'
      },
      {
        code: 'reporter_silver',
        name: 'Reportero Plata',
        description: 'Has creado 10 reportes',
        icon: '🥈',
        points_required: 150,
        criteria: 'reports_count >= 10',
        category: 'reportes',
        rarity: 'uncommon'
      },
      {
        code: 'reporter_gold',
        name: 'Reportero Oro',
        description: 'Has creado 25 reportes',
        icon: '🥇',
        points_required: 500,
        criteria: 'reports_count >= 25',
        category: 'reportes',
        rarity: 'rare'
      },
      
      // Badges de validación
      {
        code: 'verified_citizen',
        name: 'Ciudadano Verificado',
        description: '5 de tus reportes fueron validados',
        icon: '✅',
        points_required: 100,
        criteria: 'validated_reports >= 5',
        category: 'validacion',
        rarity: 'uncommon'
      },
      {
        code: 'trusted_reporter',
        name: 'Reportero de Confianza',
        description: '10 de tus reportes fueron validados',
        icon: '⭐',
        points_required: 300,
        criteria: 'validated_reports >= 10',
        category: 'validacion',
        rarity: 'rare'
      },
      
      // Badges de participación
      {
        code: 'active_participant',
        name: 'Participante Activo',
        description: 'Has participado 7 días seguidos',
        icon: '🔥',
        points_required: 200,
        criteria: 'streak >= 7',
        category: 'participacion',
        rarity: 'uncommon'
      },
      {
        code: 'community_hero',
        name: 'Héroe Comunitario',
        description: 'Has alcanzado 1000 puntos',
        icon: '🦸',
        points_required: 1000,
        criteria: 'total_points >= 1000',
        category: 'especial',
        rarity: 'legendary'
      }
    ];

    badges.forEach(badge => {
      this.db.run(
        `INSERT OR IGNORE INTO badges 
         (code, name, description, icon, points_required, criteria, category, rarity)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [badge.code, badge.name, badge.description, badge.icon, 
         badge.points_required, badge.criteria, badge.category, badge.rarity]
      );
    });
  }

  initializeRewards() {
    const rewards = [
      {
        name: 'Descuento Piscina Municipal',
        description: '20% de descuento en entrada a piscina municipal',
        points_cost: 100,
        category: 'deportes',
        available_quantity: 50
      },
      {
        name: 'Entrada Gratis Evento Cultural',
        description: 'Entrada gratuita al próximo evento cultural municipal',
        points_cost: 200,
        category: 'cultura',
        available_quantity: 30
      },
      {
        name: 'Taller Municipal Gratuito',
        description: 'Inscripción gratuita en taller municipal a elección',
        points_cost: 300,
        category: 'educacion',
        available_quantity: 20
      },
      {
        name: 'Reconocimiento Ciudadano Destacado',
        description: 'Reconocimiento público como ciudadano destacado del mes',
        points_cost: 500,
        category: 'reconocimiento',
        available_quantity: 1
      },
      {
        name: 'Plantación de Árbol con tu Nombre',
        description: 'Un árbol será plantado con una placa con tu nombre',
        points_cost: 750,
        category: 'medioambiente',
        available_quantity: 10
      },
      {
        name: 'Almuerzo con el Alcalde',
        description: 'Almuerzo con el alcalde para discutir mejoras para Catemu',
        points_cost: 1000,
        category: 'especial',
        available_quantity: 1
      }
    ];

    rewards.forEach(reward => {
      this.db.run(
        `INSERT OR IGNORE INTO rewards 
         (name, description, points_cost, category, available_quantity, active)
         VALUES (?, ?, ?, ?, ?, 1)`,
        [reward.name, reward.description, reward.points_cost, 
         reward.category, reward.available_quantity]
      );
    });
  }

  // Sistema de puntos
  async awardPoints(userIdentifier, activityType, points, referenceId = null, userName = null) {
    return new Promise((resolve, reject) => {
      // Primero, obtener o crear usuario
      this.db.get(
        'SELECT * FROM user_points WHERE user_identifier = ?',
        [userIdentifier],
        (err, user) => {
          if (err) {
            reject(err);
            return;
          }

          if (!user) {
            // Crear nuevo usuario
            this.db.run(
              `INSERT INTO user_points 
               (user_identifier, user_name, total_points, level)
               VALUES (?, ?, ?, 1)`,
              [userIdentifier, userName || 'Usuario', points],
              (err) => {
                if (err) reject(err);
                else {
                  this.logActivity(userIdentifier, activityType, points, referenceId);
                  resolve({ newUser: true, points, totalPoints: points, level: 1 });
                }
              }
            );
          } else {
            // Actualizar usuario existente
            const newTotal = user.total_points + points;
            const newLevel = this.calculateLevel(newTotal);
            
            this.db.run(
              `UPDATE user_points 
               SET total_points = ?, level = ?, updated_at = CURRENT_TIMESTAMP
               WHERE user_identifier = ?`,
              [newTotal, newLevel, userIdentifier],
              (err) => {
                if (err) reject(err);
                else {
                  this.logActivity(userIdentifier, activityType, points, referenceId);
                  
                  // Verificar nuevos badges
                  this.checkAndAwardBadges(userIdentifier);
                  
                  resolve({
                    newUser: false,
                    points,
                    totalPoints: newTotal,
                    level: newLevel,
                    levelUp: newLevel > user.level
                  });
                }
              }
            );
          }
        }
      );
    });
  }

  // Registrar actividad
  logActivity(userIdentifier, activityType, points, referenceId) {
    const descriptions = {
      'create_report': `Creaste un reporte (+${points} puntos)`,
      'complete_survey': `Completaste una encuesta (+${points} puntos)`,
      'report_validated': `Tu reporte fue validado (+${points} puntos)`,
      'report_resolved': `Tu reporte fue resuelto (+${points} puntos)`,
      'daily_login': `Inicio de sesión diario (+${points} puntos)`,
      'share_app': `Compartiste la app (+${points} puntos)`,
      'first_report': `¡Tu primer reporte! (+${points} puntos)`,
      'help_neighbor': `Ayudaste a un vecino (+${points} puntos)`
    };

    this.db.run(
      `INSERT INTO point_activities 
       (user_identifier, activity_type, points_earned, reference_id, description)
       VALUES (?, ?, ?, ?, ?)`,
      [userIdentifier, activityType, points, referenceId, 
       descriptions[activityType] || `Actividad: ${activityType} (+${points} puntos)`]
    );
  }

  // Calcular nivel basado en puntos
  calculateLevel(points) {
    if (points < 100) return 1;
    if (points < 250) return 2;
    if (points < 500) return 3;
    if (points < 1000) return 4;
    if (points < 2000) return 5;
    if (points < 3500) return 6;
    if (points < 5000) return 7;
    if (points < 7500) return 8;
    if (points < 10000) return 9;
    return 10;
  }

  // Verificar y otorgar badges
  async checkAndAwardBadges(userIdentifier) {
    return new Promise((resolve, reject) => {
      // Obtener información del usuario
      this.db.get(
        'SELECT * FROM user_points WHERE user_identifier = ?',
        [userIdentifier],
        (err, user) => {
          if (err || !user) {
            reject(err || new Error('Usuario no encontrado'));
            return;
          }

          const currentBadges = JSON.parse(user.badges || '[]');
          
          // Obtener todos los badges disponibles
          this.db.all(
            'SELECT * FROM badges',
            [],
            (err, badges) => {
              if (err) {
                reject(err);
                return;
              }

              const newBadges = [];
              
              badges.forEach(badge => {
                // Si ya tiene el badge, saltar
                if (currentBadges.includes(badge.code)) {
                  return;
                }

                // Evaluar criterio
                let earned = false;
                
                switch (badge.code) {
                  case 'first_report':
                    earned = user.reports_count >= 1;
                    break;
                  case 'first_survey':
                    earned = user.surveys_count >= 1;
                    break;
                  case 'reporter_bronze':
                    earned = user.reports_count >= 5;
                    break;
                  case 'reporter_silver':
                    earned = user.reports_count >= 10;
                    break;
                  case 'reporter_gold':
                    earned = user.reports_count >= 25;
                    break;
                  case 'verified_citizen':
                    earned = user.validated_reports >= 5;
                    break;
                  case 'trusted_reporter':
                    earned = user.validated_reports >= 10;
                    break;
                  case 'community_hero':
                    earned = user.total_points >= 1000;
                    break;
                }

                if (earned) {
                  newBadges.push(badge);
                  currentBadges.push(badge.code);
                }
              });

              // Actualizar badges del usuario
              if (newBadges.length > 0) {
                this.db.run(
                  'UPDATE user_points SET badges = ? WHERE user_identifier = ?',
                  [JSON.stringify(currentBadges), userIdentifier],
                  (err) => {
                    if (err) reject(err);
                    else resolve(newBadges);
                  }
                );
              } else {
                resolve([]);
              }
            }
          );
        }
      );
    });
  }

  // Obtener ranking de usuarios
  async getLeaderboard(limit = 10) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT user_identifier, user_name, total_points, level, badges, 
                reports_count, validated_reports
         FROM user_points 
         ORDER BY total_points DESC 
         LIMIT ?`,
        [limit],
        (err, rows) => {
          if (err) reject(err);
          else {
            const leaderboard = rows.map((row, index) => ({
              rank: index + 1,
              ...row,
              badges: JSON.parse(row.badges || '[]')
            }));
            resolve(leaderboard);
          }
        }
      );
    });
  }

  // Obtener perfil de usuario
  async getUserProfile(userIdentifier) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM user_points WHERE user_identifier = ?',
        [userIdentifier],
        async (err, user) => {
          if (err) {
            reject(err);
            return;
          }

          if (!user) {
            resolve(null);
            return;
          }

          // Obtener actividades recientes
          this.db.all(
            `SELECT * FROM point_activities 
             WHERE user_identifier = ? 
             ORDER BY created_at DESC 
             LIMIT 10`,
            [userIdentifier],
            (err, activities) => {
              // Obtener badges desbloqueados
              const userBadgeCodes = JSON.parse(user.badges || '[]');
              
              this.db.all(
                `SELECT * FROM badges WHERE code IN (${userBadgeCodes.map(() => '?').join(',')})`,
                userBadgeCodes,
                (err, badges) => {
                  resolve({
                    ...user,
                    badges: badges || [],
                    recentActivities: activities || [],
                    nextLevelPoints: this.getPointsForNextLevel(user.level),
                    progressToNextLevel: this.calculateProgress(user.total_points, user.level)
                  });
                }
              );
            }
          );
        }
      );
    });
  }

  // Calcular puntos necesarios para siguiente nivel
  getPointsForNextLevel(currentLevel) {
    const levelPoints = [0, 100, 250, 500, 1000, 2000, 3500, 5000, 7500, 10000];
    return levelPoints[currentLevel] || 10000;
  }

  // Calcular progreso al siguiente nivel
  calculateProgress(totalPoints, currentLevel) {
    const levelPoints = [0, 100, 250, 500, 1000, 2000, 3500, 5000, 7500, 10000];
    const currentLevelPoints = levelPoints[currentLevel - 1] || 0;
    const nextLevelPoints = levelPoints[currentLevel] || 10000;
    const pointsInLevel = totalPoints - currentLevelPoints;
    const pointsNeeded = nextLevelPoints - currentLevelPoints;
    return Math.min(100, Math.floor((pointsInLevel / pointsNeeded) * 100));
  }

  // Obtener recompensas disponibles
  async getAvailableRewards(userIdentifier) {
    return new Promise((resolve, reject) => {
      // Primero obtener puntos del usuario
      this.db.get(
        'SELECT total_points FROM user_points WHERE user_identifier = ?',
        [userIdentifier],
        (err, user) => {
          if (err) {
            reject(err);
            return;
          }

          const userPoints = user ? user.total_points : 0;

          // Obtener recompensas
          this.db.all(
            `SELECT * FROM rewards 
             WHERE active = 1 AND (available_quantity > 0 OR available_quantity = -1)
             ORDER BY points_cost ASC`,
            [],
            (err, rewards) => {
              if (err) reject(err);
              else {
                const rewardsWithStatus = rewards.map(reward => ({
                  ...reward,
                  canRedeem: userPoints >= reward.points_cost,
                  pointsNeeded: Math.max(0, reward.points_cost - userPoints)
                }));
                resolve(rewardsWithStatus);
              }
            }
          );
        }
      );
    });
  }

  // Canjear recompensa
  async redeemReward(userIdentifier, rewardId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM user_points WHERE user_identifier = ?',
        [userIdentifier],
        (err, user) => {
          if (err || !user) {
            reject(err || new Error('Usuario no encontrado'));
            return;
          }

          this.db.get(
            'SELECT * FROM rewards WHERE id = ? AND active = 1',
            [rewardId],
            (err, reward) => {
              if (err || !reward) {
                reject(err || new Error('Recompensa no encontrada'));
                return;
              }

              if (user.total_points < reward.points_cost) {
                reject(new Error('Puntos insuficientes'));
                return;
              }

              if (reward.available_quantity === 0) {
                reject(new Error('Recompensa agotada'));
                return;
              }

              // Realizar canje
              const newPoints = user.total_points - reward.points_cost;
              
              this.db.run('BEGIN TRANSACTION');
              
              // Actualizar puntos del usuario
              this.db.run(
                'UPDATE user_points SET total_points = ? WHERE user_identifier = ?',
                [newPoints, userIdentifier]
              );

              // Registrar canje
              this.db.run(
                `INSERT INTO reward_redemptions 
                 (user_identifier, reward_id, points_spent, status)
                 VALUES (?, ?, ?, 'pending')`,
                [userIdentifier, rewardId, reward.points_cost]
              );

              // Actualizar cantidad disponible si no es ilimitada
              if (reward.available_quantity > 0) {
                this.db.run(
                  'UPDATE rewards SET available_quantity = available_quantity - 1 WHERE id = ?',
                  [rewardId]
                );
              }

              this.db.run('COMMIT', (err) => {
                if (err) {
                  this.db.run('ROLLBACK');
                  reject(err);
                } else {
                  resolve({
                    success: true,
                    reward: reward.name,
                    pointsSpent: reward.points_cost,
                    remainingPoints: newPoints
                  });
                }
              });
            }
          );
        }
      );
    });
  }
}

module.exports = GamificationService;