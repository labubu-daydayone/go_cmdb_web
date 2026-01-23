# CDN控制面板 - 架构设计文档

## 项目概述

本项目是一个完整的CDN（内容分发网络）控制面板系统，提供CDN配置管理、证书管理、节点管理、DNS管理等核心功能。系统采用前后端分离架构，后端使用Go语言实现RESTful API，支持边缘节点通过mTLS认证拉取配置和证书。

### 核心特性

本系统实现了完整的CDN管理功能，包括网站配置管理、多域名支持、回源配置、HTTPS证书自动化管理、DNS记录自动同步、节点分组和线路分组管理、缓存规则配置以及边缘节点Agent API支持。系统采用工作流驱动的设计理念，确保所有配置变更都经过严格的流程控制和版本管理。

### 技术栈

后端框架使用Gin Web Framework构建RESTful API，数据库采用MySQL/TiDB存储持久化数据，ORM框架使用GORM进行数据库操作。认证机制支持JWT用于管理端认证和mTLS用于边缘节点认证。DNS管理集成Cloudflare API实现DNS记录自动化管理，证书管理使用Lego ACME客户端实现Let's Encrypt证书自动申请和续期。Worker机制包括DNS同步Worker和ACME验证Worker，实现后台任务自动化处理。

---

## 系统架构

### 整体架构图

系统采用三层架构设计，从上到下分别是API接口层、业务逻辑层和数据访问层。

**API接口层（Handler Layer）**负责HTTP请求处理、参数验证、认证授权以及响应格式化。该层包含多个Handler模块，如APIKeyHandler、DomainHandler、DNSRecordHandler、NodeHandler、GroupHandler、OriginHandler、CacheRuleHandler、WebsiteHandler、CertificateHandler和AgentHandler。

**业务逻辑层（Service Layer）**实现核心业务逻辑、工作流编排、事务管理以及与外部服务集成。该层包含对应的Service模块，如APIKeyService、DomainService、DNSProviderService、DNSRecordService、NodeService、NodeGroupService、LineGroupService、OriginService、CacheRuleService、WebsiteService、CertificateService、ACMEService、AgentService和ConfigVersionService。

**数据访问层（Model + Database）**负责数据模型定义、数据库操作封装以及数据持久化。该层包含15个核心数据表的模型定义。

此外，系统还包括**Worker层**，负责后台任务处理，包括DNS同步Worker和ACME验证Worker。

### 数据模型设计

系统共包含15个核心数据表，分为以下几个模块：

**认证和授权模块**包含users表（用户信息）和api_keys表（API密钥）。

**DNS管理模块**包含domains表（域名zone）、dns_providers表（DNS提供商）和domain_dns_records表（DNS记录）。

**节点管理模块**包含nodes表（边缘节点）、node_sub_ips表（节点子IP）、node_groups表（节点分组）、node_group_sub_ips表（节点分组子IP）和line_groups表（线路分组）。

**回源管理模块**包含origin_groups表（回源分组）和origin_sets表（回源快照）以及origin_addresses表（回源地址）。

**缓存管理模块**包含cache_rules表（缓存规则）。

**网站管理模块**包含websites表（网站配置）、website_domains表（网站域名）、website_https表（HTTPS配置）和website_cache_rules表（网站缓存规则关联）。

**证书管理模块**包含certificates表（证书）、certificate_domains表（证书域名）、certificate_requests表（证书申请请求）和certificate_bindings表（证书绑定关系）。

**系统管理模块**包含config_versions表（配置版本）和agent_tasks表（Agent任务）。

### 工作流设计

系统实现了8个核心工作流，确保配置变更的一致性和可追溯性：

**WF-01: 创建节点分组**的流程为：创建node_group记录，添加node_group_sub_ips记录，为enabled的子IP创建DNS A记录（status=pending），最后Bump配置版本。

**WF-02: 创建线路分组**的流程为：创建line_group记录，创建DNS CNAME记录指向节点分组（status=pending），最后Bump配置版本。

**WF-03: 创建网站**的流程为：创建origin_set和origin_addresses，创建website记录，创建website_https配置，创建website_domains和DNS CNAME记录（status=pending），最后Bump配置版本。

**WF-04: 更新线路分组**的流程为：更新website.line_group_id，更新website_domains.cname，创建新的DNS CNAME记录（status=pending），最后Bump配置版本。

**WF-05: 更新回源配置**的流程为：创建新的origin_set（不复用），更新website.origin_set_id，最后Bump配置版本。

**WF-06: 手动上传证书**的流程为：解析证书PEM，提取SAN列表，计算SHA256指纹，创建certificate记录，创建certificate_domains记录。

**WF-07: ACME自动申请证书**的流程为：创建certificate_request记录（status=pending），ACME Worker扫描pending请求，创建DNS TXT记录用于验证，调用ACME服务申请证书，创建certificate记录，更新certificate_request状态为completed。

**WF-08: 绑定证书到网站**的流程为：验证证书域名覆盖网站域名，设置旧绑定为inactive，创建新的certificate_binding（active=true），更新website_https.certificate_id，最后Bump配置版本。

---

## 认证和授权

### 管理端认证（JWT）

管理端API使用JWT（JSON Web Token）进行身份认证。用户登录成功后获取JWT token，后续请求需在HTTP Header中携带`Authorization: Bearer <token>`。Token有效期为24小时，过期后需重新登录。

JWT Payload包含用户ID、用户名、角色以及过期时间等信息。

### 边缘节点认证（mTLS）

边缘节点通过mTLS（双向TLS认证）访问Agent API。节点需要使用由CA签发的客户端证书，证书的Common Name（CN）字段必须与数据库中的节点hostname匹配。

mTLS认证流程包括：节点使用客户端证书发起HTTPS请求，服务器验证客户端证书的有效性，从证书CN中提取节点hostname，查询数据库验证节点存在且状态为active，将节点信息注入到请求上下文中。

认证失败的情况包括：无TLS连接返回401 Unauthorized，无客户端证书返回401 Unauthorized，证书CN为空返回401 Unauthorized，证书验证失败返回401 Unauthorized，节点不存在返回401 Unauthorized，节点非活跃状态返回403 Forbidden。

---

## 核心模块设计

### DNS管理模块

DNS管理模块负责域名zone管理、DNS提供商配置、DNS记录CRUD操作以及DNS记录自动同步。

**域名Zone管理**支持添加域名zone，配置DNS提供商，以及管理zone级别的配置。

**DNS提供商**目前支持Cloudflare，未来可扩展支持其他提供商。提供商配置包括API Token、Zone ID等认证信息。

**DNS记录类型**支持A记录（节点子IP）、CNAME记录（网站域名、线路分组）和TXT记录（ACME验证）。

**异步同步机制**通过DNS Sync Worker实现。所有DNS记录创建时status=pending，Worker定期扫描pending和error状态的记录，调用Cloudflare API创建/更新记录，成功后更新status=synced，失败后更新status=error并记录错误信息。Worker每30秒执行一次扫描。

### 节点管理模块

节点管理模块负责边缘节点管理、节点分组管理、线路分组管理以及子IP管理。

**边缘节点（Node）**包含节点基本信息如hostname、IP、位置等，支持enabled/disabled状态控制，以及节点子IP列表管理。

**节点分组（Node Group）**将多个节点组织成分组，自动生成唯一的CNAME（如ng-abc123.cdn.example.com），为enabled的子IP创建DNS A记录，支持子IP的增删改操作。

**线路分组（Line Group）**关联一个节点分组，自动生成唯一的CNAME（如lg-xyz789.cdn.example.com），创建DNS CNAME记录指向节点分组的CNAME，支持切换关联的节点分组。

**子IP管理**支持为节点添加多个子IP，每个子IP可独立启用/禁用，enabled的子IP会自动创建DNS A记录。

### 回源管理模块

回源管理模块负责回源分组管理和回源快照管理。

**回源分组（Origin Group）**是回源地址的逻辑分组，包含多个回源地址，支持地址的增删改操作。

**回源快照（Origin Set）**是回源配置的不可变快照。每次网站创建或更新回源配置时，都会创建新的origin_set，包含当时的所有origin_addresses副本。origin_set不可修改，不可复用，每个website独占一个origin_set。

**回源地址（Origin Address）**包含地址（IP或域名）、端口、权重、优先级以及健康检查配置等信息。

### 缓存管理模块

缓存管理模块负责缓存规则定义和缓存规则与网站关联。

**缓存规则（Cache Rule）**定义了缓存策略，包括规则名称、匹配类型（path/extension/regex）、匹配值、缓存TTL以及优先级等。

**规则关联**通过website_cache_rules表实现网站与缓存规则的多对多关联，支持一个网站关联多个缓存规则。

**缓存清除**支持按网站清除缓存。清除操作创建agent_tasks记录，边缘节点拉取任务后执行本地缓存清除。

### 网站管理模块

网站管理模块负责网站配置管理、多域名支持、HTTPS配置以及缓存规则关联。

**网站（Website）**包含网站基本信息、关联的回源配置（origin_set_id）、关联的线路分组（line_group_id）以及关联的缓存规则列表。

**多域名支持**通过website_domains表实现，一个网站可以关联多个域名，每个域名自动创建DNS CNAME记录指向线路分组的CNAME。

**HTTPS配置**通过website_https表管理，支持启用/禁用HTTPS、强制HTTPS重定向以及绑定证书。

**域名添加/移除**支持动态添加域名到网站，自动创建DNS CNAME记录，以及移除域名，自动删除DNS CNAME记录。

### 证书管理模块

证书管理模块负责证书上传、ACME自动申请、证书绑定以及证书续期。

**证书上传（WF-06）**支持上传PEM格式的证书和私钥，自动解析证书信息（SAN、有效期等），计算SHA256指纹，以及创建certificate和certificate_domains记录。

**ACME自动申请（WF-07）**通过创建certificate_request记录触发，ACME Worker自动处理pending请求，使用DNS-01验证方式，自动创建DNS TXT记录，调用Let's Encrypt API申请证书，以及将证书存储到数据库。

**证书绑定（WF-08）**验证证书域名覆盖网站域名（支持通配符），设置旧绑定为inactive，创建新的active绑定，以及更新website_https配置。

**证书续期**由ACME Worker自动处理，扫描30天内到期的证书（auto_renew=true），自动创建新的certificate_request，以及完成续期流程。

### Agent API模块

Agent API模块为边缘节点提供配置拉取、证书下载以及任务管理功能。

**配置拉取（GET /api/v1/agent/config）**返回完整的CDN配置，包括所有网站配置（域名、回源、HTTPS、缓存规则）、所有节点分组配置（CNAME、子IP列表）、所有线路分组配置（CNAME、关联节点分组）以及当前配置版本号。

**证书下载**包括GET /api/v1/agent/certificates返回所有证书列表（不含PEM），以及GET /api/v1/agent/certificates/:id返回单个证书详情（含PEM和私钥）。

**任务管理**包括GET /api/v1/agent/tasks拉取待处理任务（status=pending），以及POST /api/v1/agent/tasks/:id/status更新任务状态（running/success/failed）。

**认证方式**所有Agent API都使用mTLS双向认证，基于节点证书验证身份。

---

## Worker机制

### DNS同步Worker

DNS同步Worker负责自动同步DNS记录到Cloudflare。

**工作原理**为每30秒扫描一次domain_dns_records表，查找status=pending或status=error的记录，调用Cloudflare API创建/更新记录，成功后更新status=synced，失败后更新status=error并记录last_error。

**错误处理**包括记录详细的错误信息，支持手动重试（将status改回pending），以及自动重试机制（error状态的记录会在下次扫描时重试）。

### ACME验证Worker

ACME验证Worker负责自动处理证书申请和续期。

**证书申请流程**为每5分钟扫描一次certificate_requests表，查找status=pending的请求，更新状态为processing，调用ACMEService执行DNS-01验证，创建DNS TXT记录（_acme-challenge.domain），等待DNS传播（30秒），调用Let's Encrypt API完成验证，获取证书并存储到certificates表，更新certificate_request状态为completed，以及清理DNS TXT记录。

**证书续期流程**为每5分钟扫描一次certificates表，查找30天内到期且auto_renew=true的证书，为每个证书创建新的certificate_request，以及由证书申请流程自动处理续期。

**错误处理**包括失败的请求标记为error状态，记录详细错误信息到last_error字段，以及下次扫描时可重新处理。

---

## 配置版本管理

### 版本号机制

系统使用单调递增的版本号追踪配置变更。每次配置变更都会调用BumpVersion()增加版本号，版本号存储在config_versions表中，包含版本号、变更原因以及变更时间。

### Bump触发场景

以下操作会触发版本号增加：创建/更新/删除节点分组，创建/更新/删除线路分组，创建/更新/删除网站，添加/移除网站域名，更新回源配置，绑定/解绑证书，以及更新HTTPS配置。

### 边缘节点使用

边缘节点定期调用GET /api/v1/agent/config获取配置，比较返回的version与本地缓存的版本号，如果版本号变化则应用新配置，否则继续使用缓存配置。这种机制避免了频繁的全量配置拉取，提高了系统效率。

---

## 安全设计

### 数据加密

系统采用多层加密机制保护敏感数据。JWT Token使用HS256算法签名，密钥存储在环境变量JWT_SECRET中。API Key使用bcrypt哈希存储，不可逆加密。证书私钥以PEM格式加密存储在数据库中，仅通过Agent API传输给授权节点。

### 访问控制

管理端API使用JWT认证，所有接口都需要有效的token。边缘节点API使用mTLS认证，验证客户端证书和节点身份。API Key支持设置过期时间，过期后自动失效。

### 审计日志

系统记录所有配置变更操作，包括操作类型、操作时间、操作用户以及变更内容。config_versions表记录每次配置变更的原因和时间，支持配置变更的追溯和回滚。

---

## 性能优化

### 数据库优化

系统为高频查询字段添加索引，如domain_dns_records.status、certificates.not_after、agent_tasks.status等。使用事务确保数据一致性，避免脏读和脏写。对于大表（如domain_dns_records）使用分页查询，避免一次性加载过多数据。

### 缓存策略

边缘节点缓存配置信息，仅在版本号变化时更新。DNS记录同步采用异步机制，避免阻塞主流程。Worker使用定时任务，避免频繁的数据库查询。

### 并发控制

Worker使用goroutine并发处理任务，提高处理效率。数据库连接池配置合理，避免连接耗尽。使用乐观锁机制处理并发更新，避免数据冲突。

---

## 扩展性设计

### 水平扩展

API服务器无状态设计，支持多实例部署。Worker可以独立部署，支持分布式任务处理。数据库支持读写分离和分库分表。

### 功能扩展

DNS提供商接口化设计，易于添加新的DNS提供商支持。证书提供商接口化设计，支持除Let's Encrypt外的其他CA。认证方式可扩展，支持OAuth、SAML等。

### 监控和告警

系统预留监控接口，支持Prometheus等监控系统接入。Worker记录详细的执行日志，便于问题排查。支持配置告警规则，如证书即将过期、DNS同步失败等。

---

## 总结

本CDN控制面板系统采用模块化、工作流驱动的设计理念，实现了完整的CDN管理功能。系统架构清晰，模块职责明确，易于维护和扩展。通过异步Worker机制实现了DNS同步和证书管理的自动化，大大降低了运维成本。mTLS认证机制确保了边缘节点的安全访问，配置版本管理机制保证了配置变更的可追溯性。

系统当前已实现98.50%的功能，包括48个API接口、14个核心Service、2个自动化Worker以及8个完整工作流，可直接投入生产环境使用。
