CREATE TABLE `drink` (
  `id` char(36) NOT NULL,
  `external_id` varchar(10) NOT NULL,
  `name` varchar(100) NOT NULL,
  `instructions` longtext DEFAULT NULL,
  `category` varchar(20) NOT NULL,
  `updated_at` datetime DEFAULT NULL,
  `synced_at` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE `drink_ingredient` (
  `drink_id` char(36) NOT NULL,
  `ingredient` varchar(100) NOT NULL,
  PRIMARY KEY (`drink_id`,`ingredient`),
  CONSTRAINT `drink_ingredient__drink_id_FK` FOREIGN KEY (`drink_id`) REFERENCES `drink` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=latin1;